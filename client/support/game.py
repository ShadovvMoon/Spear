import socket
import sys
import json
import random

class GameActor(object):
	def __init__(self, game, name):

		# Create a TCP/IP socket
		sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self._sock = sock;	

		# Connect the socket to the port where the server is listening
		server_address = ('localhost', 4000)
		print('Connecting to %s port %s...' % server_address)
		sock.connect(server_address)
		
		# Send the join packet
		msg = json.dumps({
			'action' : 'join',
			'name' : name,
			'game' : game,
			'version' : '1.0'
		}).encode('utf8')
		sock.sendall(msg)
		
		def b2int(b):
			if (len(b) == 0):
				print("Error: disconnected from server")
				sys.exit(1);
			return b[3] + 256 * (b[2] + 256 * (b[1] + 256 * b[0]))

		# Listen for game state
		while True:
			data = sock.recv(4);
			count = b2int(data)
			if (count > 4096):
				print(data[0], data[1], data[2], data[3])
				print("Error: packet too large ({})".format(str(count)))
				break
		
			# read the full message
			data = sock.recv(count).decode("utf-8")
			msg = json.loads(data)
			self._onMessage(msg)
			
	def _onMessage(self, msg):
		action = msg.get("action");
		if (action == "join"):
			LINE = "-------------------"
			print(("\nConnected to lobby server\n" +\
                              "{}\nGame: {}\nVersion: {}\nAuthor:"+\
                              "{}\n{}\n").format(
                                      LINE,
                                      str(msg.get("game")),
                                      str(msg.get("version")),
                                      str(msg.get("author")),
                                      LINE
                                ))
		else:
			print("Error: invalid action")
			print(data)
