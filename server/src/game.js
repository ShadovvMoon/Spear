"use strict";

module.exports = class {
	constructor() {
		this.clients = [];
		this.html = [];
		
		// Begin the game
		let self = this;
		this.rInterval = 30;
		this.rPerTick = 10;
		this.counter = 0;
		
		setInterval(function() {
			self.render();
			
			// Ticks
			self.counter++;
			if (self.counter == self.rPerTick) {
				self.tick();
				self.counter = 0;
			}
		}, this.rInterval);  
		  
	}
	
	// Utility functions
	draw(elements, client) {
		let display = JSON.stringify({
			"action" : "render",
			"width"  : this.width,
			"height" : this.height,
			"elements" : elements
		});	
		
		if (typeof client !== 'undefined') {
			return client.send(display);
		}
		for (var client of this.html) {
  			client.send(display);
		}
	}
	
	beginBase(elements) {
		elements.push({
			"type" : "base",
			"enabled" : true
		});
	}
	
	endBase(elements) {
		elements.push({
			"type" : "base",
			"enabled" : false
		});
	}
	
	setFill(elements, color) {
		elements.push({
			"type" : "fill",
			"color" : color
		});
	}
	
	setStroke(elements, color) {
		elements.push({
			"type" : "stroke",
			"color" : color
		});
	}
	
	setFont(elements, font) {
		elements.push({
			"type" : "font",
			"font" : font
		});
	}
	
	fillCircle(elements, x, y, r) {
		elements.push({
			"type" : "circle",
			"x" : x,
			"y" : y,
			"r" : r
		});
	}

	fillCube(elements, x, y, r) {
		elements.push({
			"type" : "cube",
			"x" : x,
			"y" : y,
			"r" : r
		});
	}
	
	strokeLine(elements, x1, y1, x2, y2) {
		elements.push({
			"type" : "line",
			"x1" : x1,
			"y1" : y1,
			"x2" : x2,
			"y2" : y2
		});
	}
	
	fillText(elements, x, y, t) {
		elements.push({
			"type" : "text",
			"x" : x,
			"y" : y,
			"t" : t
		});
	}
	
	// Called every 250 ms
	tick() {
		// Update python client game state
		let state = JSON.stringify({
			"action" : "state",
			"message" : "Hello from the generic game class!"
		});
		for (var client of this.clients) {
  			client.message(state);
		}
		
		// Update html client state
		let display = JSON.stringify({
			"action" : "render",
			"width" : 400,
			"height" : 400,
			"elements" : [
				{
					"type" : "fill",
					"color" : "red"
				},
				{
					"type" : "circle",
					"x" : 200,
					"y" : 200,
					"r" : 100
				},
				{
					"type" : "circle",
					"x" : 300,
					"y" : 200,
					"r" : 50
				}
			]
		});	
		for (var client of this.html) {
  			client.send(display);
		}
	}
	
	// Called when a client joins via html
	joinHTML(client) {
		this.html.push(client);
	}
	
	// Called when a client leaves from html
	leaveHTML(client) {
		this.html.splice(this.html.indexOf(client), 1);
	}
	
	// Called when a client joins the game
	joinGame(client) {
		if (!client.active) {
			return;
		}
		this.clients.push(client);
	}
	
	// Called when a client leaves the game
	leaveGame(client) {
		if (!client.active) {
			return;
		}
		this.clients.splice(this.clients.indexOf(client), 1);
	}
	
	// Called when a client sends a message
	event(client, msg) {
		return true;
	}
}