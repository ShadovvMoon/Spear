"use strict";

const Game = require("../game.js");
module.exports = class extends Game {

	constructor() {
		super();
		
		// Arena options
		this.speed   = 1;
		this.width   = 30; // arena width
		this.height  = 30; // arena height
		this.rPerTick = 10;
		this.fadeTicks = 100;
		
		// Movement		
		this.up    = 0;
		this.down  = 1;
		this.left  = 2;
		this.right = 3;
	}
	
	renderMaze(client) {
		var elements = [];
		let self = this;
		
		this.beginBase(elements);
		this.setStroke(elements, "white");
		
		for (var x = 0; x < this.width; x++) {
			this.strokeLine(elements, x, 0, x, this.height);
		}
		
		for (var y = 0; y < this.height; y++) {
			this.strokeLine(elements, 0, y, this.width, y); 
		}
		
		this.endBase(elements);
		this.draw(elements, client);
	}

	joinHTML(client) {
		super.joinHTML(client);
		this.renderMaze(client);
	}
	
	render() {
		var elements = [];
		
		let self = this;
		let cellSize = 1;

		// Draw the players
		this.setFill(elements, "green");
		for (var client of this.clients) {
			if (!client.game.alive && client.game.death > this.fadeTicks) {
				continue;
			}
			
			// Move
			var alpha = 0.5;
			if (client.game.alive) {
				if (client.game.cd == this.up) { // up
					client.game.y -= this.speed / this.rPerTick;
				} else if (client.game.cd == this.right) { // right
					client.game.x += this.speed / this.rPerTick;
				} else if (client.game.cd == this.down) { // down
					client.game.y += this.speed / this.rPerTick;
				} else if (client.game.cd == this.left) { // left
					client.game.x -= this.speed / this.rPerTick;
				} else {
					// invalid move
				}
			
				// Bounds
				if (client.game.x < 0) {
					client.game.x = 0;
				}
				if (client.game.y < 0) {
					client.game.y = 0;
				}
				if (client.game.x >= this.width - 1) {
					client.game.x = this.width - 1;
				}
				if (client.game.y >= this.height - 1) {
					client.game.y = this.height - 1;
				}
			} else {
				alpha = 0.5 - (client.game.death / (2 * this.fadeTicks));
				client.game.death += 1;
			}
			
			// Render the player
			this.setFill(elements, "rgba(" + 
				client.game.c[0] + "," +
				client.game.c[1] + "," +
				client.game.c[2] + ", " + alpha + ")");
				
			let rx = client.game.x;
			let ry = client.game.y;
			this.fillCube(elements, rx, ry, cellSize);
			this.fillText(elements, rx + cellSize / 2, ry, client.name);
			for (var t of client.game.t) {
				this.fillCube(elements, t[0], t[1], cellSize);
			}
			
			/*
			this.setFill(elements, "rgba(" + 
				client.game.c[0] + "," +
				client.game.c[1] + "," +
				client.game.c[2] + ", 0.1)");
				
			
			*/
		}
		
		// Draw the elements
		this.draw(elements, undefined);
	}

	executeMove(client, x, y) {
	
		// Update client position
		if (client.game.cd == 0) { // up
			y -= 1;
		} else if (client.game.cd == 1) { // right
			x += 1;
		} else if (client.game.cd == 2) { // down
			y += 1;
		} else if (client.game.cd == 3) { // left
			x -= 1;
		} else {
			// invalid move
		}

		// Bounds
		if (x >= this.xsize) {
			x = this.xsize - 1 - 2 * this.padd;
		}
		if (y >= this.ysize) {
			y = this.ysize - 1 - 2 * this.padd;
		}
		if (x <= 0) {
			x = 0;
		}
		if (y <= 0) {
			y = 0;
		}			
		
		return [x, y]
	}

	tick() {
		var state_players = [];
		var state_walls = [];
		
		var id = 0;
		for (var client of this.clients) {
			if (!client.game.alive) {
				continue;
			}

			// Update move
			id++;
			if (client.game.d == 0) { // left
				if (client.game.cd == this.up) { 
				 	client.game.cd = this.left;
				} else if (client.game.cd == this.down) { 
				 	client.game.cd = this.right;
				} else if (client.game.cd == this.left) { 
				 	client.game.cd = this.down;
				} else if (client.game.cd == this.right) { 
				 	client.game.cd = this.up;
				}
			} else if (client.game.d == 1) { // right
				if (client.game.cd == this.up) { 
				 	client.game.cd = this.right;
				} else if (client.game.cd == this.down) { 
				 	client.game.cd = this.left;
				} else if (client.game.cd == this.left) { 
				 	client.game.cd = this.up;
				} else if (client.game.cd == this.right) { 
				 	client.game.cd = this.down;
				}
			} 
			
			client.game.d  = 2; // stop moving
			client.game.x = Math.round(client.game.x);
			client.game.y = Math.round(client.game.y);
			
			// Collision check
			for (var enemy of this.clients) {
				if (!enemy.game.alive) {
					continue;
				}
				for (var tail of enemy.game.t) {
					if (tail[0] == client.game.x && tail[1] == client.game.y) {
						client.game.alive = false;
						client.game.death = 0;
						break;
					}
				}
			}
			
			// Generate a tail
			client.game.t.push([
				client.game.x, 
				client.game.y
			]);

			// Alive?
			if (client.game.alive) {
				state_players.push({
					id: id,
					n: client.name,
					x: client.game.x,
					y: client.game.y
				});
				
				for (var tail of client.game.t) {
					state_walls.push({
						x: tail[0],
						y: tail[1]
					})
				}
			}
		}

		var id = 0;
		for (var client of this.clients) {
			id++;
			let state = JSON.stringify({
				action: "game",
				players: state_players,
				walls: state_walls,
				id: id
			});
			client.message(state)
		}
	}
	
	event(client, msg) {
		let action = msg['action'];
		if (action == "move") {
			client.game.d = msg['d'];
			return true;
		} 
		return false;
	}
	
	// Called when a client joins the game
	joinGame(client) {
		super.joinGame(client);
		
		// Set the game start position
		client.game = {};
		client.game.alive = true;
		client.game.cd = 0;
		client.game.death = 0;
		client.game.x  = Math.floor(Math.random() * this.width);
		client.game.y  = Math.floor(Math.random() * this.height);
		client.game.mx = client.game.x;
		client.game.my = client.game.y;
		client.game.t  = [];
		client.game.c = [
			Math.floor(Math.random() % 150 + 50), 
			Math.floor(Math.random() * 150 + 50),
			Math.floor(Math.random() * 150 + 50)
		];
	}
}