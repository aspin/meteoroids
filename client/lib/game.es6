class Game {
  constructor() {
    this.players = [];
    this.asteroids = [];
  }

  addPlayer(playerName) {
    this.players.push(new Player(playerName));
  }

  addPlayers(playerNamess) {
    for(let playerName of playerNames) {
      addPlayer(playerName);
    }
  }
}

this.Game = Game;
