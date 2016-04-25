"use strict";

module.exports = class {

	httpServer() {
		const self = this;
		const config = require("../config.js");
		
		console.log("Starting websocket server...");
		
		// Create the client server
		var WebSocketServer = require('ws').Server;
		var http = require('http');
		var server = http.createServer(function(request, response) {
			console.log((new Date()) + ' Received request for ' + request.url);
			response.writeHead(404);
			response.end();
		});
		server.listen({
			port: config.ports.html
		}, function() {
			console.log((new Date()) + ' Server is listening on port ' + config.ports.html);
		});
		var wsServer = new WebSocketServer({
			server: server,
			path: config.path.html
		});
 
		function originIsAllowed(origin) {
		  return true;
		}
 
 		var clients = [];
		wsServer.on('connection', function(connection) {
		
			// Only accept requests from an allowed origin 
			/*
			if (!originIsAllowed(request.origin)) {
			  request.reject();
			  console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
			  return;
			}
			*/
	
			// Max clients
			/*
			if (clients.length >= 3) {
				request.reject();
				console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected - too many clients.');
				return;
			}
			
			// Check protocol
			const gametypes = request.requestedProtocols;
			if (typeof gametypes === 'undefined' || gametypes.length < 1) {
				request.reject();
				console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected - missing gametype.');
				return;
			}
			let controller = null;
			for (const gametype of gametypes) {
				if (self.controllers.has(gametype)) {
					controller = self.controllers.get(gametype);
					break;
				}
			}
			if (controller == null) {
				request.reject();
				console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected - invalid gametype.');
				return;
			}
			*/
			
			//var connection = request.accept('', request.origin);
			controller.joinHTML(connection);
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
				controller.leaveHTML(connection);
				console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
			});
		});
	}

	
	gameServer(port) {
		console.log("Starting game server...");
	
		// Create the game server
		const required_version = "1.0"; // required client version
		const net = require('net');
		const config = require("../config.js");
		const self = this;
		
		var clients = [];
		var server = net.createServer((client) => {
			client.active = false;
			if (clients.length >= 30) {
				console.log("Error: kicked client - server is full");
				return client.destroy();
			}
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
				game: "",
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
					let gametype = msg['game'];

					// Guards
					if (!self.controllers.has(gametype)) {
						console.log("Error: join has invalid gametype");
						return client.destroy();
					}
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
					client.controller = self.controllers.get(gametype);
					client.controller.joinGame(client);
				} else if (!client.active || !client.controller.event(client, msg)) {
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
					client.controller.leaveGame(client);
				} else {
					console.log("Server: client disconnected");
				}
				return client.destroy();
			});
		});
		server.listen({
			port: port,
			host: config.domain,
			path: config.path.python
		});
	}

	constructor(port) {
		const self = this;
		
		// Create a single instance for each game 
		const fs = require("fs");
		const path = require('path');
		const games = path.join(__dirname, "games");
		this.controllers = new Map();
		
		// Scan the game directory
		var promise = new Promise(function(resolve, reject) {
			console.log("Scanning game directory...");
			fs.readdir(games, function (err, list) {
				if (err) {
					return reject(err);
				}
			
				for (const game of list) {
					const name = path.basename(game, path.extname(game));
					console.log("Loading " + name);
					const controller = new (require(path.join(games, game)))()
					self.controllers.set(name, controller);
				}
				resolve();
			});
		});
	
		// Launch the servers	
		promise.then(() => {
			console.log("Starting servers...");
				
			this.httpServer();
			//this.gameServer(port);
		}, console.error);
	}
}