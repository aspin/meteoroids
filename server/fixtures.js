Meteor.startup(function () {
  var boundFunction = Meteor.bindEnvironment(function() {
    Meteor.call('removeInactive');
    Meteor.call('clearBullets');
    console.log('cleaning...');
  });
  var t = setInterval(boundFunction, 50000);
  Players.remove({});
  BOSSPLAYER.remove({});
});
