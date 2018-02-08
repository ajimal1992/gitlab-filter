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

    socket.on("search_commits", function(query){
        //console.log(query);
        /*
        { 
            search: 'kedacom',
            data: 
            {   '0': 
                [ 
                    2,
                    'build-docs',
                    '<a href="https://192.168.0.18/p1s_build/build-docs">https://192.168.0.18/p1s_build/build-docs</a>' 
                ],
                '1': 
                [ 
                    6,
                    'test-repo-1',
                    '<a href="https://192.168.0.18/p1s_build/test-repo-1">https://192.168.0.18/p1s_build/test-repo-1</a>' 
                ],
                context: [ [Object] ],
                length: 2,
                selector: { rows: '.selected', cols: null, opts: [Object] },
                ajax: { __dt_wrapper: true } },
            author: true,
            msg: true 
        }
        */
        var search_query = query.search;
        if(!search_query){
            var not_filter = false;
        }
        else{
            if(search_query.charAt(0)=='!'){
                var not_filter = true;
                search_query = search_query.replace("!","");
            }
            else{
                var not_filter = false;
            }
        }
        var search_author = query.author;
        var search_msg = query.search_msg;
        var total_repos = query.data.length;
        var repo_data = query.data; //TODO:Strip unwanted data such as name and link from html side
        var r = 0;
        var request_delay = 100;
        /*
        console.log("-------------repo_data---------------")
        console.log(repo_data);
        console.log("-------------repo_data[0]---------------")
        console.log(repo_data[0]);
        console.log("-------------repo_data[0][0]---------------")
        console.log(repo_data[0][0]);
        */
        function request_repo_commits() {
            /*
            console.log("-------------repo_data[" + r + "]---------------")
            console.log(repo_data[r]);
            console.log("-------------repo_data[" + r + "][0]---------------")
            console.log(repo_data[r][0]); //@aji fix error with [r][0]
            */
            var repo_id = repo_data[r][0];
            var repo_name = repo_data[r][1];
            var options = {
                url: config.GL_SERVER + 'api/v4/projects/' + repo_id + '/repository/commits?private_token=' + config.GL_TOKEN,
                method: 'HEAD',
                rejectUnauthorized: false,
                requestCert: false,
                agent: false
            };

            request.get(options,
                function(error,response, body){
                    var total_pages = parseInt(response.headers["x-total-pages"]);
                    //loop with delay
                    var n = 1;
                    options.method = 'GET';
                    function request_page() {
                        var page = n;
                        var new_options = JSON.parse(JSON.stringify(options));
                        new_options.url = options.url + "&page=" + page;
                        request.get(new_options,
                            function(e,r,b){
                                // console.log("Error: " + e); //TODO: If error send an error 400
                                var json_data = JSON.parse(b);
                                var data = [];
                                for(var i=0; i<json_data.length; i++){
                                    var email = json_data[i].committer_email;
                                    var msg = json_data[i].message;
                                    //var web_url = '<a href="' + json_data[i].web_url + '">' + json_data[i].web_url + '</a>';
                                    //https://192.168.0.18/p1s_build/test-repo-500/commit/df98a20ae5c184a44effa0b3cf9046e53e77976a
                                    var web_url = config.GL_SERVER + '/p1s_build/' + repo_name +'/commit/' + json_data[i].id;
                                    var link = '<a href="' + web_url + '">' + json_data[i].short_id; + '</a>';
                                    var date = json_data[i].committed_date;

                                    //do filter
                                    if(search_author){
                                        if(!not_filter){
                                            if (email.toLowerCase().indexOf(search_query.toLowerCase()) == -1){
                                                continue;
                                            }
                                        }
                                        else{
                                            if (email.toLowerCase().indexOf(search_query.toLowerCase()) >= 0){
                                                continue;
                                            }
                                        } 
                                    }

                                    if(search_msg){
                                        if(!not_filter){
                                            if (msg.toLowerCase().indexOf(search_query.toLowerCase()) == -1){
                                                continue;
                                            }
                                        }
                                        else{
                                            if (msg.toLowerCase().indexOf(search_query.toLowerCase()) >=0){
                                                continue;
                                            }
                                        }
                                    }
                                    data.push([email,msg.substring(0, Math.min(40,msg.length))+"...",link,date.substring(0,10)]);
                                    // console.log("id:" + id + ", repo:" + repo + ", web_url:"+ web_url);
                                }

                                var json_response = 
                                {
                                    "ID":repo_id,
                                    "EOD":false, //End Of Data
                                    "data":null
                                }
                                if(page==total_pages){
                                    if(repo_id==repo_data[total_repos-1][0]){
                                        json_response.EOD = true;
                                    }
                                }
                                json_response.data = data;
                                io.emit("get_commits",json_response);
                            }
                        );
                        //go to next loop
                        n++;
                        if( n < (total_pages+1)){
                            setTimeout( request_page, request_delay);
                        }
                    }
                    request_page();
                }
            );
            //go to next loop
            r++;
            if( r < (total_repos)){
                setTimeout( request_repo_commits, request_delay);
            }
        };
        request_repo_commits();

    });

    socket.on("search_repos", function(query){
        var search_query = query['search'];
        var options = {
            url: config.GL_SERVER + 'api/v4/groups/' + config.GL_GRP_ID +'/projects?private_token=' + config.GL_TOKEN + 
                                    '&simple=true&per_page=100&search='+search_query,
            method: 'HEAD',
            rejectUnauthorized: false,
            requestCert: false,
            agent: false
        };
        request.get(options,
            function(error,response, body){
                // console.log("Error: " + error); //TODO: If error send an error 400
                //console.log(response.headers);
                var total_pages = parseInt(response.headers["x-total-pages"]);
                //loop with delay
                var n = 1;
                var request_delay = 100;
                options.method = 'GET';
                function request_page() {
                    var page = n;
                    var new_options = JSON.parse(JSON.stringify(options));
                    new_options.url = options.url + "&page=" + page;
                    request.get(new_options,
                        function(e,r,b){
                            // console.log("Error: " + e); //TODO: If error send an error 400
                            var json_data = JSON.parse(b);
                            var data = [];
                            for(var i=0; i<json_data.length; i++){ 
                                var id = json_data[i].id;
                                var repo = json_data[i].name;
                                var web_url = '<a href="' + json_data[i].web_url + '">' + json_data[i].web_url + '</a>';
                                data.push([id,repo,web_url]);
                                // console.log("id:" + id + ", repo:" + repo + ", web_url:"+ web_url);
                            }
                            var json_response = 
                            {
                                "EOD":false, //End Of Data
                                "data":null
                            }
                            if(page==total_pages){
                                json_response.EOD = true
                            }
                            json_response.data = data;
                            io.emit("get_repos",json_response);
                        }
                    );

                    //go to next loop
                    n++;
                    if( n < (total_pages+1)){
                        setTimeout( request_page, request_delay);
                    }
                }
                request_page();

                /*
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
                */
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
