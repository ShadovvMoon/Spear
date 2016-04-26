from support.maze import *

class MazeRobot(MazeActor):
	def __init__(self):
		MazeActor.__init__(self, "Silly")

	def tick(self):
		MazeActor.tick(self)

		if self.canMoveUp():
			self.moveUp()
		elif self.canMoveLeft():
			self.moveLeft()
		elif self.canMoveDown():
			self.moveDown()
		elif self.canMoveRight():
			self.moveRight()

if __name__ == "__main__":
	MazeRobot().start()
