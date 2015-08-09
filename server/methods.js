Meteor.methods({
  startGame: function () {
  },
  removeInactive: function() {
    // remove players that haven't been active in 30 seconds
    var t = new Date();
    t.setSeconds(t.getSeconds() - 30);
    
    var inactivePlayers = Players.find({ createdAt: { $lt: t } }).count();
    var totalPlayers = Players.find({}).count();
    Players.remove({ createdAt: { $lt: t } });
  }, 
  removePlayer: function () {
    Players.remove({_id: Session.get("userId")}, {
            x: sprite.x,
            y: sprite.y,
            rotation: sprite.rotation,
            createdAt: new Date()
    });
  }
});
