//Config
var config = require('./config/config');

//request
var request = require('request');

//setup http express server
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

//IO
var io = require('socket.io')(server);

app.use(bodyParser.json()); //use json parser

//specify the resource folders (js and CSS)
/*
app.use('/' + config.JS_DIR,express.static(path.join(__dirname + '/', config.SITE_DIR, config.JS_DIR))); 
app.use('/' + config.CSS_DIR,express.static(path.join(__dirname + '/', config.SITE_DIR, config.CSS_DIR)));
app.use('/' + config.SOCKET_DIR + '/',express.static(path.join(__dirname + '/', config.SITE_DIR, config.SOCKET_DIR)));
*/
app.use(express.static(__dirname));

var server = require('http').createServer(app); 

//Helmet Securing
var helmet = require('helmet');
app.use(helmet());

//start server
server.listen(config.PORT, function() {
    console.log('Server listening at port %d', config.PORT);
});

//IO
io.on('connection', function(socket) {
    io.emit("xxx_send_response", {msg:"sent"});

    socket.on("xxx_recv_request", function(data) {
        console.log(data);
        //process request
    });
});

//-----------------------------------controllers-----------------------------------------------//


//home controller 
app.get(config.HOME_ROUTE, function (req, res) {
	renderView(res,config.HOME_VIEW_DIR,config.HOME_FN);
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
            console.log(response.headers);
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

//catch other routes (must be the end of all other routes)
app.get("*", function(req, res){
    res.status(404)
    renderView(res,config.ERROR_VIEW_DIR,config.ERROR_404_FN);
});

//You define error-handling middleware last, after other app.use() and routes calls
app.use(function(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    console.error(err.stack)
    res.status(500)
    renderView(res,config.ERROR_VIEW_DIR,config.ERROR_FAILURE_FN);
});
  
//render view
function renderView(res,VIEW_DIR,FILE){
	res.sendFile(path.join(__dirname + '/', config.SITE_DIR, VIEW_DIR, FILE));
}
