// Setup the canvas
var c = document.getElementById("canvas");
c.width  = 600;
c.height = 600;

// Renders the current game state
var base   = [];
var target = 0;

var ctx = c.getContext("2d");
function draw() {
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.fillStyle = "#EEEEEE";
	ctx.fillRect(0, 0, c.width, c.height);
	
	// Render base
	for (var i = 0; i < base.length; i++) {
		var element = base[i];
		drawElement(element);
	}
}
draw();

function drawElement(element) {
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
		var x = element['x'];
		var y = element['y'];
		var r = element['r'];
	
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
	} else if (type == 'line') {
		var x1 = element['x1'];
		var y1 = element['y1'];
		var x2 = element['x2'];
		var y2 = element['y2'];
		
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
		ctx.stroke();
	} else if (type == 'text') {
		var x = element['x'];
		var y = element['y'];
		var t = element['t'];
	
		ctx.textAlign = "center"; 
		ctx.fillText(t,x,y);
	} else {
		console.log("Invalid type '" + type + "'")
	}
}

// Connect to the game server
var game = null;
function connect() {
	if (game != null && game.readyState == 1) {
		return;
	}

	if(!window.location.hash) {
		return;
	}
	
    var hash = window.location.hash.substring(1)
	game = new WebSocket("ws://csse1001.uqcloud.net/game", "maze");
	game.onmessage = function (event) {
		console.log("message!");
		console.log(event.data);
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
			c.width = width;
			c.height = height;
			window.width = width;
			window.height = height;
		
			// Draw the base color
			var ctx = c.getContext("2d");
			draw();
		
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
					drawElement(element);
				}
			}
		}
	};
	game.onopen = function() {
		console.log("open");
		game.send("hello");
	}
	game.onclose = function() { 
		console.log("closed");
	};
}
setInterval(connect, 10000);
connect();