Meteor.methods({
  levelOne: function(numAsteroids = 5, Xmax = 1066, Ymax = 600) {
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
        yvel: randomYvel,
        health: 15,
        scale: 1
      });
    }

    var count = 0;
    var coord = [[50, 50], [50, 550], [700, 550], [700, 50]];
    Players.find().forEach(function(player) {
      console.log(coord[count][0],coord[count][1]);
      Players.update(player._id, {$set: {status: 'reset', x: coord[count][0], y: coord[count][1]}});
      count += 1;
    });
  },
  levelTwo: function(numAsteroids = 15, Xmax = 1066, Ymax = 600) {
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
        yvel: randomYvel,
        health: 15,
        scale: Math.random() + 1
      });
    }

    var count = 0;
    var coord = [[50, 50], [50, 550], [700, 550], [700, 50]];
    Players.find().forEach(function(player) {
      console.log(coord[count][0],coord[count][1]);
      Players.update(player._id, {$set: {status: 'reset', x: coord[count][0], y: coord[count][1]}});
      count += 1;
    });
  },
  levelThree: function(numAsteroids = 15, Xmax = 1066, Ymax = 600) {
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
        yvel: randomYvel,
        health: Math.floor(Math.random() * 25),
        scale: Math.random() * 2 + 1
      });
    }

    var count = 0;
    var coord = [[50, 50], [50, 550], [700, 550], [700, 50]];
    Players.find().forEach(function(player) {
      console.log(coord[count][0],coord[count][1]);
      Players.update(player._id, {$set: {status: 'reset', x: coord[count][0], y: coord[count][1]}});
      count += 1;
    });
  },
  levelFour: function(numAsteroids = 0, Xmax = 1066, Ymax = 600) {
    console.log("starting level four");
    Asteroids.remove({});
    BOSSPLAYER.remove({});
    var randomX = Math.floor(Math.random() * Xmax);
    var randomY = Math.floor(Math.random() * Ymax);
    var randomXvel = Math.floor(Math.random() * 500) - 250;
    var randomYvel = Math.floor(Math.random() * 500) - 250;
    BOSSPLAYER.insert({
        x: randomX,
        y: randomY,
        xvel: randomXvel,
        yvel: randomYvel,
        health: Math.floor(Math.random() * 150 + 100)
    });


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
