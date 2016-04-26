from support.arena import *
import random

class ArenaRobot(ArenaActor):
	def __init__(self):
		ArenaActor.__init__(self, "Turret")

	def tick(self):
		if len(self.players()) == 0:
			return

		# Fire at a random player
		index = random.randint(0, len(self.players()) - 1)
		print(index);

		player = self.players()[index]
		self.fire(player.x(), player.y())

if __name__ == "__main__":
	ArenaRobot();
