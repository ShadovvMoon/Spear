import socket
import sys
import json
import random
from support import websocket

class GameActor(object):
	def __init__(self, game, name):

		# Create the socket
		self._ws = websocket.create_connection("ws://csse1001.uqcloud.net/game", subprotocols=[game])
		
		# Send the join packet
		msg = json.dumps({
			'action' : 'join',
			'name' : name,
			'game' : game,
			'version' : '1.0'
		}).encode('utf8')
		self._ws.send(msg)
		
		# Listen for game state
		while True:
			# read the full message
			data = self._ws.recv()
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
