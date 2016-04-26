"use strict";

const Game = require("../game.js");
module.exports = class extends Game {

	// FUNCTION
	// FROM http://dstromberg.com/2013/07/tutorial-random-maze-generation-algorithm-in-javascript/ 
 	newMaze(x, y) {

		// Establish variables and starting grid
		var totalCells = x*y;
		var cells = new Array();
		var unvis = new Array();
		for (var i = 0; i < y; i++) {
			cells[i] = new Array();
			unvis[i] = new Array();
			for (var j = 0; j < x; j++) {
				cells[i][j] = [0,0,0,0];
				unvis[i][j] = true;
			}
		}

		// Set a random position to start from
		var currentCell = [Math.floor(Math.random()*y), Math.floor(Math.random()*x)];
		var path = [currentCell];
		unvis[currentCell[0]][currentCell[1]] = false;
		var visited = 1;

		// Loop through all available cell positions
		while (visited < totalCells) {
			// Determine neighboring cells
			var pot = [[currentCell[0]-1, currentCell[1], 0, 2],
					[currentCell[0], currentCell[1]+1, 1, 3],
					[currentCell[0]+1, currentCell[1], 2, 0],
					[currentCell[0], currentCell[1]-1, 3, 1]];
			var neighbors = new Array();
	
			// Determine if each neighboring cell is in game grid, and whether it has already been checked
			for (var l = 0; l < 4; l++) {
				if (pot[l][0] > -1 && pot[l][0] < y && pot[l][1] > -1 && pot[l][1] < x && unvis[pot[l][0]][pot[l][1]]) { neighbors.push(pot[l]); }
			}
	
			// If at least one active neighboring cell has been found
			if (neighbors.length) {
				// Choose one of the neighbors at random
				var next = neighbors[Math.floor(Math.random()*neighbors.length)];
		
				// Remove the wall between the current cell and the chosen neighboring cell
				cells[currentCell[0]][currentCell[1]][next[2]] = 1;
				cells[next[0]][next[1]][next[3]] = 1;
		
				// Mark the neighbor as visited, and set it as the current cell
				unvis[next[0]][next[1]] = false;
				visited++;
				currentCell = [next[0], next[1]];
				path.push(currentCell);
			}
			// Otherwise go back up a step and keep going
			else {
				currentCell = path.pop();
			}
		}
		return cells;
	}

	constructor() {
		super();
		
		// Arena options
		this.width   = 500; // arena width
		this.height  = 500; // arena height
		this.xsize   = 10;
		this.ysize   = this.xsize;
		this.padd    = 0;
		
		// Create the maze
		this.maze = this.newMaze(this.xsize - 2 * this.padd, this.ysize - 2 * this.padd);
	}
	
	renderMaze(client) {
		var elements = [];
		let self = this;
		
		function drawWall(elements, x, y, side) {
			var dx = 0;
			var dy = 0;

			let nodeSize = 1;
			let cellSize = (self.width / self.xsize);
			
			if (side == 0) {  // top
				self.strokeLine(elements, x, y, x + cellSize, y);
			} else if (side == 1) {  // right
				self.strokeLine(elements, x + cellSize, y, x + cellSize, y + cellSize);
			} else if (side == 2) {  // bottom
				self.strokeLine(elements, x, y + cellSize, x + cellSize, y + cellSize);
			} else if (side == 3) {  // left
				self.strokeLine(elements, x, y, x, y + cellSize);
			}
		}
		
		this.beginBase(elements);
		this.setFill(elements, "red");
		for (var x = 0; x < this.maze.length; x++) {
			for (var y = 0; y < this.maze[x].length; y++) {
				// [top, right, bottom, left]
				let top    = this.maze[y][x][0];
				let right  = this.maze[y][x][1];
				let bottom = this.maze[y][x][2];
				let left   = this.maze[y][x][3];
				 
				if (top == 0) {
					drawWall(elements, (x + this.padd) * (this.width  / this.xsize), 
					                   (y + this.padd) * (this.height / this.ysize), 0);
				}
				if (right == 0) {
					drawWall(elements, (x + this.padd) * (this.width  / this.xsize), 
					                   (y + this.padd) * (this.height / this.ysize), 1);
				}
				if (bottom == 0) {
					drawWall(elements, (x + this.padd) * (this.width  / this.xsize), 
					                   (y + this.padd) * (this.height / this.ysize), 2);
				}
				if (left == 0) {
					drawWall(elements, (x + this.padd) * (this.width  / this.xsize), 
					                   (y + this.padd) * (this.height / this.ysize), 3);
				}
			}
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
		let cellSize = (self.width / self.xsize);
			
		// Draw the start marker
		this.setFill(elements, "blue");
		this.fillCircle(elements, cellSize / 2, cellSize / 2, cellSize / 3);
		
		// Draw the end marker
		this.setFill(elements, "yellow");
		this.fillCircle(elements, this.width - cellSize / 2, this.height - cellSize / 2, cellSize / 3);
		
		// Draw the players
		this.setFill(elements, "green");
		for (var client of this.clients) {
		
			let cell = this.maze[client.game.my][client.game.mx];
			if (client.game.cd == 0 && cell[0] != 0) { // up
				client.game.y -= 1 / this.rPerTick;
			} else if (client.game.cd == 1 && cell[1] != 0) { // right
				client.game.x += 1 / this.rPerTick;
			} else if (client.game.cd == 2 && cell[2] != 0) { // down
				client.game.y += 1 / this.rPerTick;
			} else if (client.game.cd == 3 && cell[3] != 0) { // left
				client.game.x -= 1 / this.rPerTick;
			} else {
				// invalid move
			}
			
			// Render the player
			this.setFill(elements, "rgba(" + 
				client.game.c[0] + "," +
				client.game.c[1] + "," +
				client.game.c[2] + ", 0.5)");
				
			let rx = (client.game.x + this.padd) * (this.width  / this.xsize) + cellSize / 2;
			let ry = (client.game.y + this.padd) * (this.height / this.ysize) + cellSize / 2;
			this.fillCircle(elements, rx, ry, cellSize / 4);
			this.fillText(elements, rx, ry - cellSize / 4 - 5, client.name);
		}
		
		
		
		// Draw the elements
		this.draw(elements, undefined);
	}

	tick() {
		for (var client of this.clients) {
			// Update client movement
			client.game.cd = client.game.d;
			client.game.d = 4;
		
			// Update client position
			let cell = this.maze[client.game.my][client.game.mx];
			if (client.game.cd == 0 && cell[0] != 0) { // up
				client.game.my -= 1;
			} else if (client.game.cd == 1 && cell[1] != 0) { // right
				client.game.mx += 1;
			} else if (client.game.cd == 2 && cell[2] != 0) { // down
				client.game.my += 1;
			} else if (client.game.cd == 3 && cell[3] != 0) { // left
				client.game.mx -= 1;
			} else {
				// invalid move
			}
			
			// Bounds
			if (client.game.mx >= this.xsize) {
				client.game.mx = this.xsize - 1 - 2 * this.padd;
			}
			if (client.game.my >= this.ysize) {
				client.game.my = this.ysize - 1 - 2 * this.padd;
			}
			if (client.game.mx <= 0) {
				client.game.mx = 0;
			}
			if (client.game.my <= 0) {
				client.game.my = 0;
			}			
			client.game.x = client.game.mx;
			client.game.y = client.game.my;
			
			// Update state
			let state = JSON.stringify({
				action: "game",
				x: client.game.x,
				y: client.game.y,
				s: this.maze[client.game.my][client.game.mx]
			});
			client.message(state);
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
		client.game.cd = 4;
		client.game.x  = this.xsize - 1 - 2 * this.padd;
		client.game.y  = this.ysize - 1 - 2 * this.padd;
		client.game.mx = this.xsize - 1 - 2 * this.padd;
		client.game.my = this.ysize - 1 - 2 * this.padd;
		client.game.c = [
			Math.floor(Math.random() % 150 + 50), 
			Math.floor(Math.random() * 150 + 50),
			Math.floor(Math.random() * 150 + 50)
		];
	}
}