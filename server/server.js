var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var port = 9000;

http.createServer(function(request, response){

    var uri = url.parse(request.url).pathname;
    var filePath = path.join(process.cwd(), uri);

    // console.log(filePath);

    var extname = path.extname(filePath);
    var contentType = 'text/html'; //.html, default case
    switch (extname){
        case '.js':
        contentType = 'text/javascript';
        break;
        case '.css':
        contentType = 'text/css';
        break;
        case '.json':
        contentType = 'application/json';
        break;
        case '.png':
        contentType = 'image/png';
        break;
        case '.jpg':
        contentType = 'image/jpg';
        break;
        case '.png':
        contentType = 'image/png';
        break;
        case '.wav':
        contentType = 'audio/wav';
        break;
    }

    fs.exists(filePath, function(exists) {
        if (!exists){
            response.writeHead(404, {"Content-Type" : "text/plain"});
            response.write("This page does not exists.\n");
            response.end();
            return;
        }

        if (fs.statSync(filePath).isDirectory()){
            filePath += "/index.html";
        }

        fs.readFile(filePath, function(error, content) {
            if (error){
                if (error.code == 'ENOENT'){
                    response.writeHead(404, {"Content-Type" : "text/plain"});
                    response.write(error + "\n");
                    response.end();
                }else{
                    response.writeHead(500, {"Content-Type" : "text/plain"});
                    response.write(error + "\n");
                    response.end();
                }
            }else{
                response.writeHead(200, {"Content-Type" : contentType});
                response.end(content, 'utf-8');
            }
        });

    });

}).listen(port);

console.log("Server running at http://localhost:" + port + ".\nPress CTRL+C to shutdown the server.");
