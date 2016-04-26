// Setup the canvas
var c = document.getElementById("canvas");
c.width  = 600;
c.height = 600;

// Renders the current game state
var base   = [];
var target = 0;

var ctx = c.getContext("2d");
function draw(width, height) {
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.fillStyle = "#EEEEEE";
	ctx.fillRect(0, 0, c.width, c.height);
	
	var scalex = c.width / width;
	var scaley = c.height / height;
		
	// Render base
	for (var i = 0; i < base.length; i++) {
		var element = base[i];
		drawElement(element, scalex, scaley);
	}
}
draw();

function elementSize(element) {
	if (type == 'circle') {
		var x = element['x'];
		var y = element['y'];
		var r = element['r'];
		return [x, y, r*2, r*2];
	} else if (type == 'line') {
		var x1 = element['x1'];
		var y1 = element['y1'];
		var x2 = element['x2'];
		var y2 = element['y2'];
		return [x1, y1, x2 - x1, y2 - y1];
	} else if (type == 'text') {
		var x = element['x'];
		var y = element['y'];
		var t = element['t'];
		return [x,y,0,0];
	} 
	return [0,0,0,0]
}

function drawElement(element, scalex, scaley) {
	var type = element['type'];
	if (type == 'fill') {
		var color = element['color'];
		ctx.fillStyle = color;
	} else if (type == 'stoke') {
		var color = element['color'];
		ctx.stokeStyle = color;
	} else if (type == 'font') {
		var font = element['font'];
		ctx.font = font;
	} else if (type == 'circle') {
		var x = element['x'] * scalex;
		var y = element['y'] * scaley;
		var r = element['r'];
	
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
	} else if (type == 'cube') {
		var x = element['x'] * scalex;
		var y = element['y'] * scaley;
		var r = element['r'];
		ctx.fillRect(x, y, r * scalex, r * scaley);
	} else if (type == 'line') {
		var x1 = element['x1'];
		var y1 = element['y1'];
		var x2 = element['x2'];
		var y2 = element['y2'];
		
		ctx.beginPath();
		ctx.moveTo(x1 * scalex, y1 * scaley);
		ctx.lineTo(x2 * scalex, y2 * scaley);
		ctx.closePath();
		ctx.stroke();
	} else if (type == 'text') {
		var x = element['x'] * scalex;
		var y = element['y'] * scaley;
		var t = element['t'];
	
		ctx.textAlign = "center"; 
		ctx.fillText(t,x,y);
	} else {
		console.log("Invalid type '" + type + "'")
	}
}

// Connect to the game server
var game = null;
var state = 0; // 0 = closed, 1 = connecting, 2 = 
function connect() {
	if ((game != null && (game.readyState == 1 || state == 1)) || !window.location.hash) {
		return;
	}
	state = 1;
	
    var hash = window.location.hash.substring(1)
	game = new WebSocket("ws://csse1001.uqcloud.net/game/socket", hash);
	game.onmessage = function (event) {
		var msg = undefined;
		try {
			msg = JSON.parse(event.data);
		} catch(err) {
			console.log("Unable to parse server message");
			console.log(err)
			return;
		}
	
		var action = msg['action'];
		if (action == "render") {
			var width = msg['width'];
			var height = msg['height'];
			var elements = msg['elements'];
		
			// Update the canvas size
			if (c.width != window.innerWidth  - 15 || c.height != window.innerHeight - 15) {
				c.width = window.innerWidth   - 15;
				c.height = window.innerHeight - 15;
			}
			var scalex = c.width / width;
			var scaley = c.height / height;
		
			// Compute the 'dirty' area
			/*
			for (var i = 0; i < elements.length; i++) {
				var element = elements[i];
				var type = element['type'];
				
				if (target == 0) {
					elementSize(element);
				}
			}
			*/
			
			// Draw the base color
			var ctx = c.getContext("2d");
			draw(width, height);
			
			// Draw the elements
			for (var i = 0; i < elements.length; i++) {
				var element = elements[i];
				var type = element['type'];
				
				// Check for render target changes
				if (type == 'base') {
					var enabled = element['enabled'];
					if (enabled) {
						base = [];
						target = 1;
					} else {
						target = 0;
					}
				} else if (target == 1) {
					base.push(element);
				} else {
					drawElement(element, scalex, scaley);
				}
			}
		}
	};
	game.onopen = function() {
		console.log("open");
		state = 2;
	}
	game.onclose = function() { 
		console.log("closed");
		state = 0;
	};
}
setInterval(connect, 5000);
connect();