"use strict";

module.exports = class {

	onHTMLClient(request) {
		const self = this;
		
		// Max clients
		if (self.httpClients.length >= 3) {
			request.reject();
			console.log((new Date()) + 
			' Connection from origin ' + request.origin + 
			' rejected - too many clients.');
			return;
		}
		
		// Check protocol
		const gametypes = request.requestedProtocols;
		if (typeof gametypes === 'undefined' || gametypes.length < 1) {
			request.reject();
			console.log((new Date()) + 
			' Connection from origin ' + request.origin + 
			' rejected - missing gametype.');
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
			console.log((new Date()) + 
			' Connection from origin ' + request.origin + 
			' rejected - invalid gametype.');
			return;
		}
		
		var connection = request.accept('', request.origin);
		controller.joinHTML(connection);
		self.httpClients.push(connection);
				
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
			self.httpClients.splice(self.httpClients.indexOf(connection), 1);
			controller.leaveHTML(connection);
			console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		});
	}
	
	onGameClient(request) {
		const self = this;
		const required_version = "1.0"; // required client version
		
		// Max clients
		if (self.gameClients.length >= 30) {
			request.reject();
			console.log((new Date()) + 
			' Connection from origin ' + request.origin + 
			' rejected - too many clients.');
			return;
		}
		
		// Check protocol
		const gametypes = request.requestedProtocols;
		if (typeof gametypes === 'undefined' || gametypes.length < 1) {
			request.reject();
			console.log((new Date()) + 
			' Connection from origin ' + request.origin + 
			' rejected - missing gametype.');
			return;
		}
		
		let play = undefined;
		let controller = null;
		for (const gametype of gametypes) {
			if (self.controllers.has(gametype)) {
				controller = self.controllers.get(gametype);
				play = gametype;
				break;
			}
		}
		if (controller == null) {
			request.reject();
			console.log((new Date()) + 
			' Connection from origin ' + request.origin + 
			' rejected - invalid gametype.');
			return;
		}
		
		// Accept the connection
		var connection = request.accept(play, request.origin);
		
		// Modified transmit packet
		let client = {};
		client.connection = connection;
		client.message = function(msg) {
			client.connection.send(msg);
		} 
		client.destroy = function() {
			client.connection.close();
		}
		self.gameClients.push(client);
		
		// Connection messages
		client.message(JSON.stringify({
			action: "join",
			game: "",
			version: 1.0,
			author: "Samuel Colbran"
		}));


		// Events
		client.packet = "";
		client.level = 0;
		connection.on('message', function(message) {
			if (message.type !== 'utf8') {
				return client.destroy();
			}
			
			// Parse JSON message
			var msg = undefined;
			try {
				msg = JSON.parse(message.utf8Data);
			} catch (err) {
				console.log("Error: unable to parse player message");
				console.log(""+message.utf8Data);
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
		});
		connection.on('error', function(err) {
			console.log(err);	
		});
		connection.on('close', function() {
			self.gameClients.splice(self.gameClients.indexOf(client), 1);
			if (client.active) {
				console.log("Server: client (" + client.name + ") disconnected");
				client.controller.leaveGame(client);
			} else {
				console.log("Server: client disconnected");
			}
			return client.destroy();
		});
	}

	httpServer() {
		const self = this;
		const fs = require("fs");
		const config = require("../config.js");
		
		self.httpClients = [];
		self.gameClients = [];
		
		console.log("Starting websocket server...");
		
		// Simple resource map
		var resource = {
			"/game/client" : "./public/client.html",
			"/game/client.js" : "./public/client.js"
		}
		
		// Create the client server
		var WebSocketServer = require('websocket').server;
		var http = require('http');
		var server = http.createServer(function(request, response) {
			console.log((new Date()) + ' Received request for ' + request.url);
			
			var path = resource[request.url];
			if (typeof path !== 'undefined') {
				fs.readFile(path, function(err, data) {
					if (err) {
						return console.log(err);
					}
					response.write(data);
					response.end();
				});
				return;
			}

			response.writeHead(404);
			response.end();
		});
		server.listen(config.ports.html, function() {
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
 
		wsServer.on('request', function(request) {
		
			// Only accept requests from an allowed origin
			console.log("Received request"); 
			if (!originIsAllowed(request.origin)) {
			  request.reject();
			  console.log((new Date()) + 
			  ' Connection from origin ' + request.origin + ' rejected.');
			  return;
			}
			
			// Select a handler
			if (request.resourceURL.path == "/game") {
				self.onGameClient(request);
			} else if (request.resourceURL.path == "/game/socket") {
				self.onHTMLClient(request);
			} else {
				request.reject();
			  	console.log((new Date()) + 
			  	' Connection from origin ' + request.origin + 
			  	' rejected - invalid path \''+request.resourceURL.path+'\'');
			  	return;
			}	
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
			console.log("Starting server...");
			this.httpServer();
		}, console.error);
	}
}