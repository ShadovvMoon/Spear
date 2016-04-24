"use strict";

module.exports = class {

	httpServer(game) {
	
		// Create the client server
		var WebSocketServer = require('websocket').server;
		var http = require('http');
		var server = http.createServer(function(request, response) {
			console.log((new Date()) + ' Received request for ' + request.url);
			response.writeHead(404);
			response.end();
		});
		server.listen(8080, function() {
			console.log((new Date()) + ' Server is listening on port 8080');
		});
		var wsServer = new WebSocketServer({
			httpServer: server,
			// You should not use autoAcceptConnections for production 
			// applications, as it defeats all standard cross-origin protection 
			// facilities built into the protocol and the browser.  You should 
			// *always* verify the connection's origin and decide whether or not 
			// to accept it. 
			autoAcceptConnections: false
		});
 
		function originIsAllowed(origin) {
		  return true;
		}
 
 		var clients = [];
		wsServer.on('request', function(request) {
		
			// Only accept requests from an allowed origin 
			if (!originIsAllowed(request.origin)) {
			  request.reject();
			  console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
			  return;
			}
	
			var connection = request.accept('', request.origin);
			game.joinHTML(connection);
			clients.push(connection);
					
			// Events
			console.log((new Date()) + ' Connection accepted.');
			connection.on('message', function(message) {
				if (message.type === 'utf8') {
					console.log('Received Message: ' + message.utf8Data);
					connection.sendUTF(message.utf8Data);
				}
				else if (message.type === 'binary') {
					console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
					connection.sendBytes(message.binaryData);
				}
			});
			
			connection.on('close', function(reasonCode, description) {
				clients.splice(clients.indexOf(connection), 1);
				game.leaveHTML(connection);
				console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
			});
		});

	}

	constructor(port) {
		let game = new (require('./games/maze.js'))()
		
		// Create the http server
		this.httpServer(game);
		
		// Create the game server
		let required_version = "1.0"; // required client version
		let net = require('net');
		
		var clients = [];
		var server = net.createServer(function(client) {
			client.active = false;
			clients.push(client);
			
			// Utility function
			// Source: http://stackoverflow.com/questions/4021813/sending-data-from-node-js-to-java-over-tcp 
			function writeInt(stream, int){
			   var bytes = new Array(4)
			   bytes[0] = int >> 24
			   bytes[1] = int >> 16
			   bytes[2] = int >> 8
			   bytes[3] = int
			   stream.write(new Buffer(bytes))
			}

			// Modified transmit packet
			client.message = function(msg) {
				writeInt(client, msg.length);
				client.write(msg);
			} 
	
			// Connection messages
			client.message(JSON.stringify({
				action: "join",
				game: "maze",
				version: 1.0,
				author: "Samuel Colbran"
			}));

			function onMessage(client, data) {
			
				// Parse JSON message
				var msg = undefined;
				try {
					msg = JSON.parse(data);
				} catch (err) {
					console.log("Error: unable to parse player message");
					console.log(""+data);
					console.log(err);
					return client.destroy();
				}
				
				// Retrieve message action
				let action = msg['action'];
				if (typeof action === 'undefined') {
					console.log("Error: missing action");
					return client.destroy();
				}
				
				// Handle action
				if (action == "join" && typeof client.name == 'undefined') {
					let name = msg['name'];
					let version = msg['version'];
					
					// Guards
					if (typeof name === 'undefined') {
						console.log("Error: join is missing name");
						return client.destroy();
					}
					if (typeof version === 'undefined') {
						console.log("Error: join is missing version");
						return client.destroy();
					}
					if (version != required_version) {
						client.message(JSON.stringify({
							"action" : "error",
							"message" : ("please update your client to version "	+ required_version)
						}));
						console.log("Error: join is missing version");
						return client.destroy();
					}
					
					// Welcome! Send to the current game handler...
					console.log("Server: client (" + name + ") joined");
					client.name    = name;
					client.version = version;
					client.active  = true;
					game.joinGame(client);
				} else if (!game.event(client, msg)) {
					console.log("Error: invalid action \"" + action + "\"");
					return client.destroy();
				}
			}

			// Events
			client.packet = "";
			client.level = 0;
			client.on('data', function(data) {
				
				// Attempt to split the data up into dictionaries
				var messages = [];
				for (var i = 0; i < data.length; i++) {
				
					// Separate the message
					var c = String.fromCharCode(data[i]);
					if (c == "{") {
						client.level++;
					} else if (c == "}") {
						client.level--;
						if (client.level == 0) {
							messages.push("{" + client.packet + "}");
							client.packet = "";
						}
					} else {
						client.packet += c;
					}
					
					// Maximum packet size
					if (client.packet.length > 1024) {
						return client.disconnect();
					}
				}
			
				for (var message of messages) {
					onMessage(client, message);
				}
			});
			client.on('error', function(err) {
				console.log(err);	
			});
			client.on('close', function() {
				clients.splice(clients.indexOf(client), 1);
				if (client.active) {
					console.log("Server: client (" + client.name + ") disconnected");
					game.leaveGame(client);
				} else {
					console.log("Server: client disconnected");
				}
				return client.destroy();
			});
		});
		server.listen(port, '127.0.0.1');
	}
}