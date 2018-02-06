//Config
var config = require('./config/config');

//request
var request = require('request');

//setup http express server
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var server = require('http').createServer(app);  //** create server before initiating the socket...


//IO
var io = require('socket.io')(server);

app.use(bodyParser.json()); //use json parser

//specify the resource folders (js and CSS)
/*
app.use('/' + config.JS_DIR,express.static(path.join(__dirname + '/', config.SITE_DIR, config.JS_DIR))); 
app.use('/' + config.CSS_DIR,express.static(path.join(__dirname + '/', config.SITE_DIR, config.CSS_DIR)));
app.use('/' + config.SOCKET_DIR + '/',express.static(path.join(__dirname + '/', config.SITE_DIR, config.SOCKET_DIR)));
*/

//start server
server.listen(config.PORT, function() {
    console.log('Server listening at port %d', config.PORT);
});

app.use(express.static(path.join(__dirname, config.SITE_DIR)));

//IO
io.on('connection', function(socket) {
    /*
    io.emit("xxx_send_response", {msg:"sent"});

    socket.on("xxx_recv_request", function(data) {
        console.log(data);
        //process request
    });
    */

    socket.on("search_repos", function(query){
        var search_query = query['search'];
        //console.log("Search: '" + search_query + "'");
        var options_ori = {
            url: config.GL_SERVER + 'api/v4/groups/' + config.GL_GRP_ID +'/projects?private_token=' + config.GL_TOKEN + '&simple=true&per_page=100&search='+search_query,
            method: 'HEAD',
            rejectUnauthorized: false,
            requestCert: false,
            agent: false
        };
        //console.log(options);
        request.get(options,
            function(error,response, body){
                // console.log("Error: " + error); //TODO: If error send an error 400
                console.log(response.headers);
                var total_pages = parseInt(response.headers.x-total-pages);
                var n = 1; //loop with delay
                var request_delay = 200;
                function request_page() {
                    //request
                    //var options = JSON.parse(JSON.stringify(options_ori));

                    /*
                    replace options with this...
                    var x = "asdasdasdasd=asdsad&sasdda&page=13asasasassad";
                    var y = x.substring(0,x.search("page=")+5) + 23;
                    console.log(y);
                    */
                    n++;
                    if( n < (total_pages+1)){
                        setTimeout( request_page, request_delay);
                    }
                }
                request_page();
                var json_data = JSON.parse(body);
                var data = [];
                for(var i=0; i<json_data.length; i++){ //TODO: BETTER logic to remove duplicate forloop
                    var id = json_data[i].id;
                    var repo = json_data[i].name;
                    var web_url = '<a href="' + json_data[i].web_url + '">' + json_data[i].web_url + '</a>';
                    data.push([id,repo,web_url]);
                    // console.log("id:" + id + ", repo:" + repo + ", web_url:"+ web_url);
                }
                //res.send(data);
                io.emit("get_repos",data);

                //clear memory
                data=[]; 
                delete body;
                delete error;
                var completed_page = 1;

                //check if there are multiple pages
                if("1" != response.headers.x-total-pages){
                    var total_pages = parseInt(response.headers.x-total-pages);
                    for(var i=2; i==total_pages; i++){

                    }
                }
            }
        );
    });
});

//-----------------------------------controllers-----------------------------------------------//


//home controller 
app.get(config.HOME_ROUTE, function (req, res) {
	renderView(res,config.HOME_FN);
});

//repos controller
app.get(config.REPO_ROUTE, function(req, res){
    var search_query = req.query['search'];
    //console.log("Search: '" + search_query + "'");
    var options = {
		url: config.GL_SERVER + 'api/v4/groups/' + config.GL_GRP_ID +'/projects?private_token=' + config.GL_TOKEN + '&simple=true&per_page=100&search='+search_query,
		rejectUnauthorized: false,
		requestCert: false,
		agent: false
	};
	//console.log(options);
	request.get(options,
		function(error,response, body){
            var json_data = JSON.parse(body);
            // console.log("Error: " + error); //TODO: If error send an error 400
            //console.log(response.headers);
            var data = [];
            for(var i=0; i<json_data.length; i++){
                var id = json_data[i].id;
                var repo = json_data[i].name;
                var web_url = '<a href="' + json_data[i].web_url + '">' + json_data[i].web_url + '</a>';
                data.push([id,repo,web_url]);
                // console.log("id:" + id + ", repo:" + repo + ", web_url:"+ web_url);
            }
			res.send(data);
		}
	);
    //res.send("test");
});
//other controllers...
//app.get/post...

//route to home on get root
app.get("/", function(req, res){
    res.redirect(config.HOME_ROUTE);
});

// //catch other routes (must be the end of all other routes)
// app.get("*", function(req, res){
//     res.status(404)
//     renderView(res,config.ERROR_404_FN);
// });

//You define error-handling middleware last, after other app.use() and routes calls
app.use(function(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    console.error(err.stack)
    res.status(500)
    renderView(res,config.ERROR_FAILURE_FN);
});
  
//render view
function renderView(res,FILE){
	res.sendFile(path.join(__dirname, config.SITE_DIR, FILE));
}
