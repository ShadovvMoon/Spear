from support.arena import *

class ArenaRobot(ArenaActor):
	def __init__(self):
		ArenaActor.__init__(self, "Silly")

	def tick(self):
		ArenaActor.tick(self)

		# fire randomly
		x = random.randint(0, 500)
		y = random.randint(0, 500)
		self.fire(x, y)

		# move randomly
		direction = random.randint(0, 3)
		if (direction == 0):
			self.moveUp()
		elif (direction == 1):
			self.moveDown()
		elif (direction == 2):
			self.moveLeft()
		elif (direction == 3):
			self.moveRight()

if __name__ == "__main__":
	ArenaRobot().start()
