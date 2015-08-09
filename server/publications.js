Meteor.publish('players', function() {
  // this._session.socket.on("close", Meteor.bindEnvironment(function() {
  //   Players.remove(this.userId);
  // }, function(err) {
  //   console.log(err)
  // }));

  return Players.find();
});

Meteor.publish('asteroids', function(){
  return Asteroids.find();
});

Meteor.publish('bullets', function() {
  return Bullets.find();
});

Meteor.publish('scoreboard', function() {
  return Scoreboard.find();
});

Meteor.publish('bossPlayer', function() {
  return BOSSPLAYER.find();
});
