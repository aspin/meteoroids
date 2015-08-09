Meteor.startup(function () {
  var boundFunction = Meteor.bindEnvironment(function() {
    Meteor.call('removeInactive');
  });
  var t = setInterval(boundFunction, 500);
  
  Meteor.call('createAsteroids', 5, 1066, 600);
});
