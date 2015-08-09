Meteor.methods({
  addPlayer: function(id, x, y, rotation) {
    if (Players())
    Players.insert({
      _id: id,
      x: x,
      y: y,
      rotation: rotation,
      createdAt: new Date()
    });
  },
  updatePlayer: function(id, x, y, rotation) {
    Players.update({_id: id}, {
      x: x,
      y: y,
      rotation: rotation,
      createdAt: new Date()
    });
  },
  removeInactive: function() {
    // remove players that haven't been active in 30 seconds
    var t = new Date();
    t.setSeconds(t.getSeconds() - 30);

    var inactivePlayers = Players.find({ createdAt: { $lt: t } }).count();
    var totalPlayers = Players.find({}).count();
    Players.remove({ createdAt: { $lt: t } });
  }
});
