"use strict";

module.exports = class {
	constructor() {
		const self = this;
		const bufferSize = 512;
		const buffer = Buffer.allocUnsafe(bufferSize);
		
		let offset = 0;
		function writeByte(b) {
			if (offset >= bufferSize) {
				self.flush()
			}
			if (b >= 256) {
				b = 0;
			} else if (b < 0) {
				b = 0;
			}
			
			buffer.writeUInt8(b, offset);
			offset++;
		}
		function writeShort(s) {
			writeByte(Math.floor(s / 256));
			writeByte(Math.floor(s % 256));
		}
		function writeFloat(s) {
			writeShort(Math.floor(s * 1000)); // -30 to 30 with 3 decimal places
		}
		function writeString(s) {
			writeByte(s.length);
			for (var i = 0; i < s.length; i++) {
				writeByte(s.charCodeAt(i));
			}
		}
		this.flush = function() {
			const data = buffer.slice(0, offset);
			self.output(data);
			offset = 0;
		}
		
		// Render buffers
		this.beginBufferWrite = function(identifier) {
			writeByte(0);
		}
		this.setTargetBuffer = function(identifier) {
			writeByte(1);
			writeByte(identifier); // up to 256 render buffers
		}
		this.drawBuffer = function(identifier) {
			writeByte(2);
			writeByte(identifier); // up to 256 render buffers
		}
		this.createBuffer = function(identifier, width, height) {
			writeByte(23);
			writeByte(identifier); // up to 256 render buffers
			writeShort(width);
			writeShort(height);
		}
		this.endBufferWrite = function() {
			writeByte(3);
		}
		
		this.pushMatrix = function() {
			writeByte(4);
		}
		this.popMatrix = function() {
			writeByte(5);
		}
		this.translate = function(x, y) {
			writeByte(6);
			writeShort(x);
			writeShort(y);
		}
		
		// Render states
		this.fillStyle = function(style) {
			writeByte(7);
			writeString(style);
		}
		this.strokeStyle = function(style) {
			writeByte(8);
			writeString(style);
		}
		this.fontStyle = function(style) {
			writeByte(9);
			writeString(style);
		}
		this.textAlign = function(style) {
			writeByte(10);
			writeString(style);
		}
		
		// Render functions
		this.fill = function() {
			writeByte(11);
		}
		this.stroke = function() {
			writeByte(12);
		}
		
		// Path functions
		this.beginPath = function() {
			writeByte(13);
		}
		this.closePath = function() {
			writeByte(14);
		}
		this.moveTo = function(x, y) {
			writeByte(15);
			writeShort(Math.floor(x));
			writeShort(Math.floor(y));
		}
		this.lineTo = function(x, y) {
			writeByte(16);
			writeShort(Math.floor(x));
			writeShort(Math.floor(y));
		}
		this.arc = function(x, y, a1, a2) {
			writeByte(17);
			writeShort(Math.floor(x));
			writeShort(Math.floor(y));
			writeFloat(a1);
			writeFloat(a2);
		}
		
		// Extra
		this.fillText = function(x, y, text) {
			writeByte(18);
			writeShort(Math.floor(x));
			writeShort(Math.floor(y));
			writeString(text);
		}
		this.fillRect = function(x, y, w, h) {
			writeByte(19);
			writeShort(Math.floor(x));
			writeShort(Math.floor(y));
			writeShort(Math.floor(w));
			writeShort(Math.floor(h));
		}
		this.fillCircle = function(x, y, r) {
			writeByte(20);
			writeShort(Math.floor(x));
			writeShort(Math.floor(y));
			writeShort(Math.floor(r));
		}
		this.clearRect = function(x, y, w, h) {
			writeByte(21);
			writeShort(Math.floor(x));
			writeShort(Math.floor(y));
			writeShort(Math.floor(w));
			writeShort(Math.floor(h));
		}
		this.resize = function(w, h) {
			writeByte(22);
			writeShort(Math.floor(w));
			writeShort(Math.floor(h));
		}
	}
	
	draw(output) {
		this.output = output;
	}
}