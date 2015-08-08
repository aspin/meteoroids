class Player {
  constructor(name) {
    this.name = name;
    this.position = new Position(0, 0);
    this.velocity = new Velocity(0, 0);
    this.heading = 90;
    this.health = 1000;
  }

  changeHeading(direction) {

  }

  accelerate() {

  }
}

class Position {
  constructor(x, y) {

  }
}

class Velocity {
  constructor(speed, direction) {

  }
}

this.Player = Player;
this.Position = Position;
this.Velocity = Velocity;
