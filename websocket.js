#!/usr/bin/env node
process.stdout.write('\033c');
console.log("====NodeJS Websocket Server V3 R2=====");
console.log(" ");
var WebSocketServer = require('websocket').server;
var http = require('http');
var current = '1';
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    current = 0;
    console.log((new Date()) + ' Connection accepted from ' + connection.remoteAddress);
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            if (message.utf8Data == 'help') {
				console.log('received help request');
				connection.sendUTF('Sending help options');
			}
       else if(message.utf8Data.indexOf('login') !== -1) {
                      const readline = require('readline');
                      const fs1 = require('fs');
                      const rl = readline.createInterface({
                      input: fs1.createReadStream('users/user.txt')
                     });   
                      rl.on('line', function (line) {
                       console.log('Line from file:', line);
                        if (message.utf8Data.indexOf(line) !== -1) {
                           var fs2 = require('fs');
                          var stream2 = fs2.createWriteStream("users/currentconnections.txt", {'flags': 'a'});
                          stream2.once('open', function(fd) {
                         stream2.write( connection.remoteAddress + " " + message.utf8Data + "\r\n");
                         stream2.end();
                         connection.sendUTF('Login sucessful!');
 				
                           }); 
			
                         } 
			else
			{
			connection.sendUTF('Login Failed!');
			}
 			
                    });
		

                }
            else if(message.utf8Data.indexOf('register') !== -1) {
                     const readline22 = require('readline');
                      const fs13 = require('fs');
                      var s = message.utf8Data;
                      s= s.substr(13)
                     s = s.substr(0, s.indexOf('?'));
                     console.log(s);
                      const rl3 = readline22.createInterface({
                      input: fs13.createReadStream('users/user.txt')
                     });   
                      rl3.on('line', function (line) {
                       console.log('Line from file:', line);
                        if (line.indexOf(s) !== -1) {
                          current = '1';
                          console.log('User is already registered');
                            connection.sendUTF('register failed on user');
                           }
                           else  {
                            current = '0';
                           }
                            
                   
                         
                    });
                      setTimeout(allowed, 1000);
                      function allowed() {
                          if (current == '0') {
                          console.log('current :' + current);
                           var fs = require('fs');
                           var stream = fs.createWriteStream("users/user.txt", {'flags': 'a'});
                           stream.once('open', function(fd) {
                           stream.write("login " + message.utf8Data + "\r\n");
                           stream.end();
                           connection.sendUTF('register sucessful');
                          });
                        
                    
                }
}
}
               
            else if(message.utf8Data == "endoutofserver") {
                var fs = require('fs');
                    var stream = fs.createWriteStream("users/nonexistant/lol.txt", {'flags': 'a'});
                    stream.once('open', function(fd) {
                      stream.write( message.utf8Data + "/n");
                      stream.end();
                  });
            }
            else if(message.utf8Data.includes("currentprofile")) {
		locip = message.utf8Data;
		console.log("Message shortened from " + locip);
		locip = locip.substr(15);
		console.log("To " + locip);
               const readline2 = require('readline');
                      const fs12 = require('fs');
                      const rl2 = readline2.createInterface({
                      input: fs12.createReadStream("users/currentconnections.txt")
			
                     });   
                      rl2.on('line', function (line) {
                       console.log('Line from file:', line);
                        if (line.indexOf(connection.remoteAddress) !== -1) {
			  if (line.includes(locip)) {
			    console.log(line + " " + locip);
			    line = line.substr(37);
                            line = line.substr(0, line.indexOf('?'));
                            connection.sendUTF(line);
				
			 }
                          
                         } 
                    });
                  }
			else 
			{
        console.log('received');
				connection.sendUTF(message.utf8Data);
			}
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
