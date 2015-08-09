Meteor.methods({
  startGame: function(numAsteroids = 5, Xmax = 1066, Ymax = 600) {
    Asteroids.remove({});
    for(var i = 0; i < numAsteroids; i++) {
      var randomX = Math.floor(Math.random() * Xmax);
      var randomY = Math.floor(Math.random() * Ymax);
      var randomXvel = Math.floor(Math.random() * 500) - 250;
      var randomYvel = Math.floor(Math.random() * 500) - 250;

      Asteroids.insert({
        x: randomX,
        y: randomY,
        xvel: randomXvel,
        yvel: randomYvel
      });
    }
  },
  removeInactive: function() {
    // remove players that haven't been active in 30 seconds
    // var t = new Date();
    // t.setSeconds(t.getSeconds() - 60);
    //
    // var inactivePlayers = Players.find({ createdAt: { $lt: t } }).count();
    // var totalPlayers = Players.find({}).count();
    // Players.remove({ createdAt: { $lt: t } });
  },
  ping: function(message) {
    console.log(message);
  }
});
