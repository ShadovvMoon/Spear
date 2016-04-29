"use strict";

const Game = require("../game.js");
module.exports = class extends Game {

	generateMaze() {
	
		this.xsize  += this.xsize;
		this.ysize   = this.xsize;
		
		// Create the maze
		this.maze = this.newMaze(this.xsize - 2 * this.padd, this.ysize - 2 * this.padd);
		
		// Update clients
		for (var client of this.html) {
			this.writeBuffers(client);
		}
	}

	constructor() {
		super();

		// Arena options
		this.width   = 512; // arena width
		this.height  = 512; // arena height
		
		this.padd    = 0;
		this.xsize   = 3;
		this.ysize   = this.xsize;
		
		// Create the renderer
		this.gl = new (require("../draw.js"))();
		this.bufferMaze  = 0;
		this.bufferStart = 1;
		this.bufferEnd   = 2;
		this.bufferTail = 3;
		this.generateMaze();
	}
	
	writeBuffers(client) {
		let cellSize = (this.width / this.xsize);
		
		// Render target
		this.gl.draw(function(data) {
			client.send(data);
		})
		if (typeof client.buffers === 'undefined') {
			this.gl.createBuffer(this.bufferMaze , this.width, this.height);
			this.gl.createBuffer(this.bufferStart, this.width, this.height);
			this.gl.createBuffer(this.bufferEnd  , this.width, this.height);
			this.gl.createBuffer(this.bufferTail, this.width, this.height);
			client.buffers = true;
		}
		
		this.gl.beginBufferWrite();
		
		// Maze
		//--------------------------------------------
		this.gl.setTargetBuffer(this.bufferMaze);
		this.gl.clearRect(0, 0, this.width, this.height);
		this.gl.strokeStyle("black");
		this.gl.beginPath();
		for (var x = 0; x < this.maze.length; x++) {
			for (var y = 0; y < this.maze[x].length; y++) {
				let top    = this.maze[y][x][0];
				let right  = this.maze[y][x][1];
				let bottom = this.maze[y][x][2];
				let left   = this.maze[y][x][3];
				 
				let dx = (x + this.padd) * (this.width  / this.xsize);
				let dy = (y + this.padd) * (this.height / this.ysize);
				if (top == 0) {
					this.gl.moveTo(dx			, dy);
					this.gl.lineTo(dx + cellSize, dy);
				}
				if (right == 0) {
					this.gl.moveTo(dx + cellSize, dy);
					this.gl.lineTo(dx + cellSize, dy + cellSize);
				}
				if (bottom == 0) {
					this.gl.moveTo(dx			, dy + cellSize);
					this.gl.lineTo(dx + cellSize, dy + cellSize);
				}
				if (left == 0) {
					this.gl.moveTo(dx, dy);
					this.gl.lineTo(dx, dy + cellSize);
				}
			}
		}
		this.gl.closePath();
		this.gl.stroke();
		//--------------------------------------------
		
		// Start
		//--------------------------------------------
		this.gl.setTargetBuffer(this.bufferStart);
		this.gl.clearRect(0, 0, this.width, this.height);
		this.gl.fillStyle("blue");
		this.gl.fillCircle(cellSize / 2, cellSize / 2, cellSize / 3);
		//--------------------------------------------
		
		// End
		//--------------------------------------------
		this.gl.setTargetBuffer(this.bufferEnd);
		this.gl.clearRect(0, 0, this.width, this.height);
		this.gl.fillStyle("yellow");
		this.gl.fillCircle(this.width - cellSize / 2, this.height - cellSize / 2, cellSize / 3);
		//--------------------------------------------
		
		// Tail
		//--------------------------------------------
		this.gl.setTargetBuffer(this.bufferTail);
		this.gl.clearRect(0, 0, this.width, this.height);
		//--------------------------------------------
		
		this.gl.endBufferWrite();
		this.gl.flush();
	}

	joinHTML(client) {
		super.joinHTML(client);
		this.writeBuffers(client);
	}
	
	render() {
		let cellSize = (this.width / this.xsize);
		
		// Render target
		const self = this;
		this.gl.draw(function(data) {
			for (var client of self.html) {
				client.send(data);
			}
		})
		
		// Render base components
		this.gl.resize(this.width, this.height);
		this.gl.clearRect(0, 0, this.width, this.height);
		this.gl.drawBuffer(this.bufferMaze);
		this.gl.drawBuffer(this.bufferStart);
		this.gl.drawBuffer(this.bufferEnd);
		this.gl.drawBuffer(this.bufferTail);
		this.gl.textAlign("center");
		
		// Draw players
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
			this.gl.fillStyle("rgba(" + 
				client.game.c[0] + "," +
				client.game.c[1] + "," +
				client.game.c[2] + ", 0.5)");
				
			let rx = (client.game.x + this.padd) * (this.width  / this.xsize) + cellSize / 2;
			let ry = (client.game.y + this.padd) * (this.height / this.ysize) + cellSize / 2;
			this.gl.fillCircle(rx, ry, cellSize / 4);
			this.gl.fillText(rx, ry - cellSize / 4 - 5, client.name);
			
			// Render a tail
			this.gl.beginBufferWrite();
			this.gl.setTargetBuffer(this.bufferTail);	
			this.gl.fillStyle("rgba(" + 
				client.game.c[0] + "," +
				client.game.c[1] + "," +
				client.game.c[2] + ", 0.05)");
			this.gl.fillCircle(rx, ry, cellSize / 4);
			this.gl.endBufferWrite();
		}
		
		// Draw the elements
		this.gl.flush();
	}

	executeMove(client, x, y) {
	
		// Update client position
		let cell = this.maze[y][x];
		if (client.game.cd == 0 && cell[0] != 0) { // up
			y -= 1;
		} else if (client.game.cd == 1 && cell[1] != 0) { // right
			x += 1;
		} else if (client.game.cd == 2 && cell[2] != 0) { // down
			y += 1;
		} else if (client.game.cd == 3 && cell[3] != 0) { // left
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
		for (var client of this.clients) {
			var c = this.executeMove(client, client.game.mx, client.game.my);
			client.game.mx = c[0];
			client.game.my = c[1];
			client.game.x = client.game.mx;
			client.game.y = client.game.my;
			
			// Map movements
			let cellSize = (this.width / this.xsize);
			let rx = (client.game.x + this.padd) * (this.width  / this.xsize);
			let ry = (client.game.y + this.padd) * (this.height / this.ysize);
			if (client.game.t.length > 10) {
				client.game.t.shift()
			}
			this.fillCube(client.game.t, rx, ry, cellSize);
			
			// Update client movement
			client.game.cd = client.game.d;
			client.game.d = 4;
			
			// Update state
			c = this.executeMove(client, client.game.mx, client.game.my);
			let state = JSON.stringify({
				action: "game",
				x: c[0],
				y: c[1],
				s: this.maze[c[1]][c[0]]
			});
			client.message(state);

			// Update game
			if (client.game.mx == 0 && client.game.my == 0) {
				this.generateMaze();
				for (var client of this.clients) {
					client.game.mx = this.xsize - 1;
					client.game.my = this.ysize - 1;
				}
				return;
			}
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
		client.game.t  = [];
		client.game.c = [
			Math.floor(Math.random() % 150 + 50), 
			Math.floor(Math.random() * 150 + 50),
			Math.floor(Math.random() * 150 + 50)
		];
	}
	
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

}