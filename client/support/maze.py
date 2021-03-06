from support.game import *
class MazeActor(GameActor):
	def __init__(self, name):
		GameActor.__init__(self, "maze", name)
		self._canMove = False;

	def _onMessage(self, msg):
		action = msg.get("action");
		if (action == "game"):
			self._x = msg.get("x")
			self._y = msg.get("y")
			self._s = msg.get("s")

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

	def x(self):
		return self._x

	def y(self):
		return self._y

	def canMoveUp(self):
		return self._s[0] == 1

	def canMoveDown(self):
		return self._s[2] == 1

	def canMoveLeft(self):
		return self._s[3] == 1

	def canMoveRight(self):
		return self._s[1] == 1

	def moveUp(self):
		self._move(0)

	def moveDown(self):
		self._move(2)

	def moveLeft(self):
		self._move(3)

	def moveRight(self):
		self._move(1)

	def moveStop(self):
		self._move(5)

	def tick(self):
		pass

