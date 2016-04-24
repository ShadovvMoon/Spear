"use strict";

const Game = require("../game.js");
module.exports = class extends Game {
	constructor() {
		super();
		
		this.state = 0;
		this.bullets = [];
		this.queue = [];
	
		// Bullet options
		this.clean   = 100; // bullet cleanup age
		this.fire    = 50;  // bullet tick age
		this.bradius = 5;  // bullet radius
		this.damage  = 20;
		
		// Game options
		this.minPlayers = 2;
		
		// Player options
		this.maxHP  	= 100;
		this.maxFade  	= 30;
		this.maxEnergy 	= 10;
		this.move   	= 10;  // player speed
		this.radius 	= 20;  // player radius
		
		// Arena options
		this.width  = 500; // arena width
		this.height = 500; // arena height
	}
	
	event(client, msg) {
		let action = msg['action'];
		if (!client.playing || client.game.ft > 0) {
			return true;
		} else if (action == "move") {
		
			// Move in the desired direction
			if (client.game.energy > 0 && msg['d'] != 4 && msg['d'] != 5) {
				client.game.energy -= 1; // movement costs 1 energy
				client.game.d = msg['d'];
			} else {
				client.game.d = 4; // no energy [or they don't want to move]
			}
			
			// Valid command
			return true;
			
		} else if (action == "fire") {
		
			// Move in the desired direction
			if (client.game.energy > 0) {
				client.game.energy -= 1; // shooting costs 1 energy
				
				let x = msg['x'];
				let y = msg['y'];
				let dx = (x - client.game.x);
				let dy = (y - client.game.y);
				let no = Math.sqrt(dx * dx + dy * dy);
			
				this.bullets.push({
					o: client,
					x: client.game.x,
					y: client.game.y,
					d: this.damage,
					t: 0,
					a: true,
					dx: dx / this.fire, // / this.rPerTick,
					dy: dy / this.fire, // / this.rPerTick
					ex: x,
					ey: y
				});
			}
			
			// Valid command
			return true;
		}
		return false;
	}
	
	
	draw(elements) {
		let display = JSON.stringify({
			"action" : "render",
			"width"  : this.width,
			"height" : this.height,
			"elements" : elements
		});	
		for (var client of this.html) {
  			client.send(display);
		}
	}
	
	render() {
		var elements = [];
		function setFill(color) {
			elements.push({
				"type" : "fill",
				"color" : color
			});
		}
		function setFont(font) {
			elements.push({
				"type" : "font",
				"font" : font
			});
		}
		function fillCircle(x, y, r) {
			elements.push({
				"type" : "circle",
				"x" : x,
				"y" : y,
				"r" : r
			});
		}
		function fillText(x, y, t) {
			elements.push({
				"type" : "text",
				"x" : x,
				"y" : y,
				"t" : t
			});
		}
		
		// pre-game / post-game
		if (this.state == 0 || this.state == 2) {
			setFont("20px Ariel");
			setFill("black");
			if (this.state == 0) {
				fillText(this.width / 2, this.height / 2, "Waiting for players...");
				fillText(this.width / 2, this.height / 2 + 25, this.queue.length + " / " + this.minPlayers);
			} else {
				fillText(this.width / 2, this.height / 2, this.postgame);	
			}
			this.draw(elements);
			return;
		}
	
		// in-game
		// Animation
		let self = this;
		function animateClient(client) {
			let d = client.game.d;
			if (d == 0) { // up
				client.game.y += self.move / self.rPerTick;
			} else if (d == 1) { // down
				client.game.y -= self.move / self.rPerTick;
			} else if (d == 2) { // left
				client.game.x -= self.move / self.rPerTick;
			} else if (d == 3) { // right
				client.game.x += self.move / self.rPerTick;
			} else if (d != 4) {
				return false; // invalid direction
			}
			
			// Repair bounds
			if (client.game.x < self.radius) {
				client.game.x = self.radius;
			}
			if (client.game.y < self.radius) {
				client.game.y = self.radius;
			}
			if (client.game.x > self.width - self.radius) {
				client.game.x = self.width - self.radius;
			}
			if (client.game.y > self.height - self.radius) {
				client.game.y = self.height - self.radius;
			}
		}
		
		
		// Rendering
		
		// Draw each of the players
		for (var client of this.clients) {
			if (!client.playing || client.game.ft > 0) {
				continue;
			} 
			
			animateClient(client);
  			setFill("rgb(" +
				client.game.c[0] + "," +
				client.game.c[1] + "," +
				client.game.c[2] + ")");
				
			fillCircle(client.game.x, client.game.y, this.radius);
			fillText(client.game.x, client.game.y - this.radius - 5, client.name);
			
			setFill("white");
			fillText(client.game.x, client.game.y + 0, client.game.hp);
			fillText(client.game.x, client.game.y + 9, client.game.energy);
		}
		
		// Draw bullets
		for (var bullet of this.bullets) {
			if (bullet.t < this.fire) {
				bullet.x += bullet.dx;
				bullet.y += bullet.dy;
				bullet.t += 1;
				
				// Collision check
				if (bullet.t == this.fire) {
					setFill("red");
					fillCircle(bullet.x, bullet.y, this.bradius);
			
					for (var client of this.clients) {
						if (!client.playing || client == bullet.o || client.game.ft > 0) {
							continue; // We cannot shoot ourselves
						}
					
						// Distance between bullet and client
						let distance = Math.sqrt(
							Math.pow(client.game.x - bullet.x, 2) + 
							Math.pow(client.game.y - bullet.y, 2)
						);
						
						if (distance <= this.radius + this.bradius) {
							// Collision
							client.game.hp -= bullet.d; 
							if (client.game.hp > 0) {
								continue; // still alive
							}
							
							// The player is dead!
							client.game.hp = 0; // health
							client.game.ft = 1; // fade timer [aka dead]
							
							// Queue for the next round 
							client.playing = false;
							let index = this.queue.indexOf(client)
							if (index == -1) {
								this.queue.push(client);
							}
							
							// Explode
							let r = 30;
							let particles = 5;
							for (var p = 0; p < particles; p++) {
								let dx = r * Math.sin((2 * Math.PI * p) / particles);
								let dy = r * Math.cos((2 * Math.PI * p) / particles);
								this.bullets.push({
									o: client,
									x: client.game.x,
									y: client.game.y,
									d: 0,
									t: 0,
									a: true,
									dx: dx / this.fire,
									dy: dy / this.fire
								});
							}
							
						}
					}
				}
			}
			bullet.a += 1;
			
			// Parabola that intersects at t = 0 and this.fire = 0
			let m = 5;
			let a = -4 * m / (this.fire * this.fire);
			let b = +4 * m / (this.fire);
			let s = a * bullet.t * bullet.t + b * bullet.t;
			
			// Remove expired bullets
			if (bullet.a == this.clean) {
				this.bullets.splice(this.bullets.indexOf(bullet), 1);
			}
			
			// Generate circle
			setFill("rgba(" + 
				bullet.o.game.c[0] + "," +
				bullet.o.game.c[1] + "," +
				bullet.o.game.c[2] + "," +
				(this.clean - bullet.a) / this.clean + ")");
			fillCircle(bullet.x, bullet.y, this.bradius + s);
		}
		this.draw(elements);
	}
	
	start() {
		this.bullets = [];
		for (var client of this.queue) {	
			client.playing = true;
			client.game = {}
			client.game.ft = 0;
			client.game.c = [
				Math.floor(Math.random() % 150 + 50), 
				Math.floor(Math.random() * 150 + 50),
				Math.floor(Math.random() * 150 + 50)
			];
		
			client.game.energy = this.maxEnergy;
			client.game.hp = this.maxHP;
			client.game.x = Math.floor(Math.random() * (this.width  - this.radius)) + this.radius;
			client.game.y = Math.floor(Math.random() * (this.height - this.radius)) + this.radius;
		}
		this.queue = [];
	}
	
	tick() {
		// Update python client game state
		var state_players = [];
		var state_bullets = [];
		
		/*
		let state = JSON.stringify({
			"action" : "state",
			"players" : [
				id: 
			
			
			]
		});
		*/
		
		// Play
		if (this.state == 1) {
			var last  = "";
			var alive = 0;
			var id = 0;
			
			for (var client of this.clients) {
				id++;
				
				if (!client.playing) {
					continue;
				}
				client.game.energy += 1; // +1 energy!
				client.game.d = 4; 		 // stop moving
			
				// Alive?
				if (client.game.ft == 0) {
					last = client.name;
					alive++;
					
					state_players.push({
						id: id,
						n: client.name,
						x: client.game.x,
						y: client.game.y,
						h: client.game.hp,
						e: client.game.energy
					});
				}
			}
			
			for (var bullet of this.bullets) {
				if (bullet.t >= this.fire || bullet.d == 0) {
					continue;
				}
				state_bullets.push({
					x: bullet.ex,
					y: bullet.ey,
					t: (this.fire - bullet.t) / this.rPerTick // time until land 
				});
			}
			
			var id = 0;
			for (var client of this.clients) {
				id++;
				if (!client.playing || client.game.ft > 0) {
					continue;
				}
				let state = JSON.stringify({
					action: "game",
					players: state_players,
					bullets: state_bullets,
					id: id
				});
				client.message(state)
			}
		} 
		
		// Pre-game
		else if (this.state == 0 && this.queue.length >= this.minPlayers) {
			this.state = 1;
			this.start();
			return;
		}
		
		// Post-game
		if (alive > 1 || this.state != 1) {
			return;
		}
		
		// Move any alive players to the queue
		for (var client of this.clients) {
			if (client.playing) {
				client.playing = false;
				let index = this.queue.indexOf(client)
				if (index == -1) {
					this.queue.push(client);
				}
			}
		}
		
		
		// Display the 'game over' message
		this.state = 2;

		// Display the winner
		if (alive > 0) {
			this.postgame = last + " won!";
		} else {
			this.postgame = "Draw!";
		}
		
		// Start a new match
		let self = this;
		setTimeout(function() {
			self.state = 0;
		}, 3000);
	}
	
	joinGame(client) {
		super.joinGame(client);
	
		client.playing = false;
		this.queue.push(client);
	}
	
	leaveGame(client) {
		super.leaveGame(client);
	
		let index = this.queue.indexOf(client)
		if (index != -1) {
			this.queue.splice(index, 1);
		}
	}
}