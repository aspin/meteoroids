var X_MAX = 1066;
var Y_MAX = 600;

var playerId, game, playerSpaceship, cursors, bullet, bullets, asteroid, asteroids, explosions;
var players = {};
var activePlayer = false;
var bulletTime = 0;

Template.meteoroid.onRendered(function() {
  game = new Phaser.Game(X_MAX, Y_MAX, Phaser.AUTO, 'meteoroid', { preload: preload, create: create, update: update, render: render });
  window.onbeforeunload = function() { Players.remove(playerId); };
});

Template.meteoroid.events({
  "click #restart": function(event, template){
    Meteor.call("startGame", function(error, result){
      if(error){
        console.log("error", error);
      } else {
        drawAsteroids();
      }
    });
  }
});

Template.meteoroid.onDestroyed(function(){
  Players.remove(playerId);
});

function preload() {
  game.load.image('space', 'assets/skies/deep-space.jpg');
  game.load.image('bullet', 'assets/games/asteroids/bullets.png');
  game.load.image('ship', 'assets/games/asteroids/ship3.png');
  game.load.image('asteroid', 'assets/games/asteroids/asteroid.png');
  game.load.spritesheet('explosion', 'assets/games/asteroids/explode.png', 128, 128);
}

function create() {
  game.renderer.clearBeforeRender = false;
  game.renderer.roundPixels = true;
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.add.tileSprite(0, 0, game.width, game.height, 'space');

  asteroids = game.add.group();
  asteroids.enableBody = true;
  asteroids.physicsBodyType = Phaser.Physics.ARCADE;

  game.physics.arcade.enable(asteroids, Phaser.Physics.ARCADE);

  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(3, 'bullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 0.5);

  playerSpaceship = game.add.sprite(50, 50, 'ship');
  playerSpaceship.anchor.set(0.5);
  game.physics.enable(playerSpaceship, Phaser.Physics.ARCADE);
  playerSpaceship.body.drag.set(100);
  playerSpaceship.body.maxVelocity.set(400);
  playerSpaceship.body.collideWorldBounds=true;
  playerSpaceship.body.bounce.setTo(0.2,0.2);

  explosions = game.add.group();
  explosions.createMultiple(30, 'explosion');

  explosions.forEach(function(asteroid) {
    asteroid.anchor.x = 0.5;
    asteroid.anchor.y = 0.5;
    asteroid.animations.add('explosion');
  }, this);

  //  Game input
  cursors = game.input.keyboard.createCursorKeys();
  game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

  if (Players.find().count() >= 4) {
    alert("You may join, but others cannot see you");
  } else {
    activePlayer = true;
    playerId = Players.insert({
      x: playerSpaceship.x,
      y: playerSpaceship.y,
      rotation: playerSpaceship.rotation,
      createdAt: new Date()
    });

    Players.find().forEach(function(player) {
      addPlayer(player);
    })

    Players.find().observeChanges({
      added: function(id, fields) {
        fields._id = id;
        addPlayer(fields);
      },
      changed: function(id, fields) {
        fields.x && (players[id].x = fields.x);
        fields.y && (players[id].y = fields.y);
        fields.rotation && (players[id].rotation = fields.rotation);
      },
      removed: function(id) {
        players[id].destroy();
      }
    });

    Asteroids.find().observeChanges({
      added: function(id, fields) {
        drawAsteroids();
      },
      removed: function(id) {
        asteroids.forEach(function(asteroid) {
          if (asteroid._id == id) {
            asteroid.kill();
          }
        })
      }
    })
  }
}

function update() {

  if (cursors.up.isDown) {
    game.physics.arcade.accelerationFromRotation(playerSpaceship.rotation, 200, playerSpaceship.body.acceleration);
  } else {
    playerSpaceship.body.acceleration.set(0);
  }

  if (cursors.left.isDown) {
    playerSpaceship.body.angularVelocity = -300;
  } else if (cursors.right.isDown) {
    playerSpaceship.body.angularVelocity = 300;
  } else {
    playerSpaceship.body.angularVelocity = 0;
  }

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
    fireBullet();
  }
  game.physics.arcade.collide(asteroids, playerSpaceship, collisionHandler, null, this);
  for (var pid in players) {
    game.physics.arcade.collide(asteroids, players[pid], collisionHandler, null, this);
  }

  screenWrap(playerSpaceship);

  // ** CUSTOM CODE **
  if (activePlayer) {
    var me = Players.findOne({ _id: playerId });
    if (me && me.x === playerSpaceship.x && me.y === playerSpaceship.y && me.rotation === playerSpaceship.rotation) {
    } else if (me) {
      Players.update({_id: playerId}, {$set: {
        x: playerSpaceship.x,
        y: playerSpaceship.y,
        rotation: playerSpaceship.rotation,
        createdAt: new Date()
      }});
    }
  }
}

function collisionHandler (playerSpaceship, asteroid) {
  console.log('collision!');
  console.log(playerSpaceship);
  Asteroids.remove({_id: asteroid._id});
  asteroid.kill();
  var explosion = explosions.getFirstExists(false);
  explosion.reset(playerSpaceship.body.x, playerSpaceship.body.y);
  explosion.play('explosion', 30, false, true);
}

function fireBullet () {
  if (game.time.now > bulletTime)
  {
    bullet = bullets.getFirstExists(false);

    if (bullet)
    {
      bullet.reset(playerSpaceship.body.x + 16, playerSpaceship.body.y + 16);
      bullet.lifespan = 2000;
      bullet.rotation = playerSpaceship.rotation;
      game.physics.arcade.velocityFromRotation(playerSpaceship.rotation, 400, bullet.body.velocity);
      bulletTime = game.time.now + 50;
    }
  }
}

function screenWrap (sprite) {
  if (sprite.x < 0) {
    sprite.x = game.width;
  } else if (sprite.x > game.width) {
    sprite.x = 0;
  }

  if (sprite.y < 0) {
    sprite.y = game.height;
  } else if (sprite.y > game.height) {
    sprite.y = 0;
  }
}

function render() {

}

function addPlayer(player) {
  var newSpaceship = game.add.sprite(player.x, player.y, 'ship');
  newSpaceship.rotation = player.rotation;
  newSpaceship.anchor.set(0.5);
  players[player._id] = newSpaceship;
}

function drawAsteroids() {
  Asteroids.find().forEach(function(ast) {
    asteroid = asteroids.create(ast.x, ast.y, 'asteroid');
    asteroid.body.velocity = new Phaser.Point(ast.xvel, ast.yvel);
    asteroid.body.collideWorldBounds=true;
    asteroid.body.bounce.setTo(1, 1);
    asteroid._id = ast._id;
  });
}
