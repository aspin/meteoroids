Meteor.methods({
  createAsteroids: function(num, Xmax, Ymax) {
    for(var i = 0; i < num; i++) {
      var randomX = Math.floor(Math.random() * Xmax);
      var randomY = Math.floor(Math.random() * Ymax);
      Asteroids.insert({x: randomX, y: randomY});
    }
  },
  removeInactive: function() {
    // remove players that haven't been active in 30 seconds
    var t = new Date();
    t.setSeconds(t.getSeconds() - 60);

    var inactivePlayers = Players.find({ createdAt: { $lt: t } }).count();
    var totalPlayers = Players.find({}).count();
    Players.remove({ createdAt: { $lt: t } });
  },
  removePlayer: function(id) {
    console.log(id);
    Players.remove({ _id: id });
  }
});
