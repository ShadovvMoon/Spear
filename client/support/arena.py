from support.game import *

class Player(object):
	def __init__(self, name):
		self._name = name

	def name(self):
		return self._name

	def health(self):
		return self._hp

	def energy(self):
		return self._energy

	def x(self):
		return self._x

	def y(self):
		return self._y

class Bullet(object):
	def __init__(self):
		pass

	def x(self):
		return self._x

	def y(self):
		return self._y
	
	def ticks(self):
		return self._t
	
class ArenaActor(GameActor, Player):
	def __init__(self, name):
		GameActor.__init__(self, "arena", name)
		Player.__init__(self, name)
		self._canMove = False;
		
	def _onMessage(self, msg):
		action = msg.get("action");
		if (action == "game"):
			self._pid = msg.get("id")

			# encode players into Player objects
			self._players = []
			self._bullets = []
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
				p._hp     = m.get('h')
				p._energy = m.get('e')


			for m in msg.get("bullets"):
				p         = Bullet()
				p._t      = m.get('t')
				p._x      = m.get('x')
				p._y      = m.get('y')
				self._bullets.append(p)

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
		
	def fire(self, x, y):
		msg = json.dumps({
			'action' : 'fire',
			'x' : x,
			'y' : y
		}).encode('utf8')
		self._ws.send(msg)

	def players(self):
		return self._players

	def bullets(self):
		return self._bullets

	def moveUp(self):
		print("Robot: moving up")
		self._move('0')

	def moveDown(self):
		print("Robot: moving down")
		self._move('1')

	def moveLeft(self):
		print("Robot: moving left")
		self._move('2')

	def moveRight(self):
		print("Robot: moving right")
		self._move('3')
		
	def tick(self):
		self._move(5) # used as a heartbeat
