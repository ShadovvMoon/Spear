from support.game import *

class Player(object):
	def __init__(self, name):
		self._name = name

	def name(self):
		return self._name

	def x(self):
		return self._x

	def y(self):
		return self._y

class Wall(object):
	def __init__(self):
		pass

	def x(self):
		return self._x

	def y(self):
		return self._y
	
class TronActor(GameActor, Player):
	def __init__(self, name):
		GameActor.__init__(self, "tron", name)
		Player.__init__(self, name)
		self._canMove = False;
		
	def _onMessage(self, msg):
		action = msg.get("action");
		if (action == "game"):
			self._pid = msg.get("id")

			# encode players into Player objects
			self._players = []
			self._walls = []
			for m in msg.get("players"):
				if m.get('id') == msg.get("id"):
					p = self
				else:
					p = Player(m.get('n'))
					self._players.append(p)

				# Configure player
				p._id     = m.get('id')
				p._x      = m.get('x')
				p._y      = m.get('y')


			for m in msg.get("walls"):
				p         = Wall()
				p._x      = m.get('x')
				p._y      = m.get('y')
				self._walls.append(p)

			self._canMove = True;
			self.tick()
		else:
			GameActor._onMessage(self, msg)

	def _move(self, direction):
		if not self._canMove:
			raise RuntimeError("You can only move once per tick")
			
		msg = json.dumps({
			'action' : 'move',
			'd' : direction
		}).encode('utf8')

		self._canMove = False;
		self._ws.send(msg)

	def players(self):
		return self._players

	def walls(self):
		return self._walls

	def turnLeft(self):
		self._move('0')

	def turnRight(self):
		self._move('1')
		
	def tick(self):
                pass
