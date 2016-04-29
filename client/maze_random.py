from support.maze import *
import random

class MazeRobot(MazeActor):
	def __init__(self):
		MazeActor.__init__(self, "Random")

	def tick(self):
		MazeActor.tick(self)

		if self.x() == 0 and self.y() == 0:
			return

		while True:
			move = random.randint(0, 4)
			if move == 0 and self.canMoveUp():
				self.moveUp()
				break
			elif move == 1 and self.canMoveLeft():
				self.moveLeft()
				break
			elif move == 2 and self.canMoveDown():
				self.moveDown()
				break
			elif move == 3 and self.canMoveRight():
				self.moveRight()
				break

if __name__ == "__main__":
	MazeRobot().start()
