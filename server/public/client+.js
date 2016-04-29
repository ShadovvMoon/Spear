// Setup the canvas
var c = document.getElementById("canvas");
c.width  = 600;
c.height = 600;

// Renders the current game state
var base   = [];
var target = 0;

var main = c.getContext("2d");
var ctx = main;

// Connect to the game server
var game = null;
var state = 0; // 0 = closed, 1 = connecting, 2 = 
function connect() {
	if ((game != null && (game.readyState == 1 || state == 1)) || !window.location.hash) {
		return;
	}
	state = 1;
	
	// Render settings
	var overflow = [];
	var bytes;
	var offset;
	var debug;
   	var buffers = {};
    
	// Extract server from url
	var url = "ws://" + window.location.host + 
		window.location.pathname.slice(0, 
		window.location.pathname.length - "client+.html".length) + "socket";
    var hash = window.location.hash.substring(1)
    
    // Functions
	function readByte() {
		var result = null;
		if (offset < 0) {
			result = overflow[overflow.length + offset];
		} else {
			result = bytes[offset];
		}
		offset++;
		return result;
	}
	function readShort() {
		return readByte() * 256 + readByte();
	}
	function readFloat(c) {
		return readShort() / 1000.0;
	}
	function readString(c) {
		var length = readByte();
		var remain = bytes.length - offset; 
		if (remain < length) {
			return null;
		}
		
		var result = "";
		for (var i = 0; i < length; i++) {
			result += String.fromCharCode(readByte());
		}
		return result;
	}
	function undo(undo) {
		if (debug) console.log("Undo " + undo);
		overflow = bytes.slice(offset - undo, bytes.length);
		if (debug) console.log("Overflow " + overflow);
		offset = -overflow.length;
	}
	
	execute = true;
	debug = false;
    offset = 0;

    function parseBytes() {
    	for (var i = 0; i < bytes.length; i++) {
			var b = readByte();
			var remain = bytes.length - offset; 
			
			if (b == 0) {
				if (debug) {console.log("beginBufferWrite()");}
			} else if (b == 23) { //createBuffer
				if (remain < 5) {undo(1); return;}
				var target = readByte();
				var w = readShort();
				var h = readShort();
				buffers[target] = document.createElement("canvas");
				buffers[target].width  = w;
				buffers[target].height = h;
				if (debug) {console.log("createBuffer(" + target + ", " + x + ", " + y + ")");}
			} else if (b == 1) {
				if (remain < 1) {undo(1); return;}
				var target = readByte();
				if (typeof buffers[target] === 'undefined') {console.error("Invalid buffer " + target);}
				ctx = buffers[target].getContext("2d");
				if (debug) {console.log("setTargetBuffer(" + target + ")");}
			} else if (b == 2) { // drawBuffer
				if (remain < 1) {undo(1); return;}
				var target = readByte();

				// Set new state
				if (typeof buffers[target] === 'undefined') {console.error("Invalid buffer " + target); return;}
				var bctx = buffers[target];
				var c = document.getElementById("canvas");
				ctx.drawImage(bctx, 0, 0);

			} else if (b == 3) {
				if (debug) {console.log("endBufferWrite()");}
				target = -1;
				ctx = main;
			} else if (b == 4) { // pushMatrix
				if (debug) {console.log("pushMatrix()");}
			} else if (b == 5) { // popMatrix
				if (debug) {console.log("popMatrix()");}
			} else if (b == 6) { // translate
				if (remain < 4) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				if (debug) {console.log("translate()");}
			} else if (b == 7) { // fillStyle
				if (remain < 1) {undo(1); return;}
				var style = readString();
				if (style == null) {undo(2); return;}
				if (debug) {console.log("fillStyle('"+style+"')");}
				if (execute) ctx.fillStyle = style;
			} else if (b == 8) { // strokeStyle
				if (remain < 1) {undo(1); return;}
				var style = readString();
				if (style == null) {undo(2); return;}
				if (debug) {console.log("strokeStyle('"+style+"')");}
				if (execute) ctx.strokeStyle = style;
			} else if (b == 9) { // fontStyle
				if (remain < 1) {undo(1); return;}
				var style = readString();
				if (style == null) {undo(2); return;}
				if (debug) {console.log("fontStyle('"+style+"')");}
				if (execute) ctx.font = style;
			} else if (b == 10) { // textAlign
				if (remain < 1) {undo(1); return;}
				var style = readString();
				if (style == null) {undo(2); return;}
				if (debug) {console.log("textAlign('"+style+"')");}
				if (execute) ctx.textAlign = style;
			} else if (b == 11) { // fill
				if (debug) {console.log("fill()");}
				if (execute) ctx.fill();
			} else if (b == 12) { // stroke
				if (debug) {console.log("stroke()");}
				if (execute) ctx.stroke();
			} else if (b == 13) { // beginPath
				if (debug) {console.log("beginPath()");}
				if (execute) ctx.beginPath();
			} else if (b == 14) { // closePath
				if (debug) {console.log("closePath()");}
				if (execute) ctx.closePath();
			} else if (b == 15) { // moveTo
				if (remain < 4) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				if (debug) {console.log("moveTo("+x+", "+y+")");}
				if (execute) ctx.moveTo(x, y);
			} else if (b == 16) { // lineTo
				if (remain < 4) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				if (debug) {console.log("lineTo("+x+", "+y+")");}
				if (execute) ctx.lineTo(x, y);
			} else if (b == 17) { // arc
				if (remain < 8) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				var a1 = readFloat();
				var a2 = readFloat();
				if (debug) {console.log("arc("+x+", "+y+", "+a1+", "+a2+")");}
				if (execute) ctx.arc(x, y, a1, a2, false);
			} else if (b == 18) { // fillText
				if (remain < 4) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				var text = readString();
				if (text == null) {undo(6); return;}
				if (debug) {console.log("fillText("+x+", "+y+", '"+text+"')");}
				if (execute) ctx.fillText(text, x, y);
			} else if (b == 19) { // fillRect
				if (remain < 8) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				var w = readShort();
				var h = readShort();
				if (debug) {console.log("fillRect("+x+", "+y+", "+w+", "+h+")");}
				if (execute) ctx.fillRect(x, y, w, h);
			} else if (b == 20) { // fillCircle
				if (remain < 6) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				var r = readShort();
				if (debug) {console.log("fillCircle("+x+", "+y+", "+r+")");}
				if (execute) {
					ctx.beginPath();
					ctx.arc(x, y, r, 0, Math.PI*2, true); 
					ctx.closePath();
					ctx.fill();
				}
			} else if (b == 21) { // clearRect
				if (remain < 8) {undo(1); return;}
				var x = readShort();
				var y = readShort();
				var w = readShort();
				var h = readShort();
				if (debug) {console.log("clearRect("+x+", "+y+", "+w+", "+h+")");}
				if (execute) ctx.clearRect(x, y, w, h);
			} else if (b == 22) { // resize
				if (remain < 4) {undo(1); return;}
				var w = readShort();
				var h = readShort();
				if (debug) {console.log("resize("+w+", "+h+")");}
				if (execute) {
					var c = document.getElementById("canvas");
					if (c.width != w || c.height != h) {
						c.width  = w;
						c.height = h;
					}
				}
			}
		}
		offset = 0;
    }
    
	game = new WebSocket(url, hash);
	game.binaryType = 'arraybuffer';
	game.onmessage = function (event) {
		bytes = new Uint8Array(event.data);
		bytes.slice = bytes.subarray;
		parseBytes();
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