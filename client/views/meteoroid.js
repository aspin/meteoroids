var X_MAX = 1066;
var Y_MAX = 600;

var playerId, game, sprite, cursors, bullet, bullets, asteroid, asteroids, randomXPosition, randomYPosition, explosions;
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

  sprite = game.add.sprite(50, 50, 'ship');
  sprite.anchor.set(0.5);
  game.physics.enable(sprite, Phaser.Physics.ARCADE);
  sprite.body.drag.set(100);
  sprite.body.maxVelocity.set(400);
  sprite.body.collideWorldBounds=true;
  sprite.body.bounce.setTo(0.2,0.2);

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
      x: sprite.x,
      y: sprite.y,
      rotation: sprite.rotation,
      createdAt: new Date()
    });
  }
}

function update() {

  if (cursors.up.isDown) {
    game.physics.arcade.accelerationFromRotation(sprite.rotation, 200, sprite.body.acceleration);
  } else {
    sprite.body.acceleration.set(0);
  }

  if (cursors.left.isDown) {
    sprite.body.angularVelocity = -300;
  } else if (cursors.right.isDown) {
    sprite.body.angularVelocity = 300;
  } else {
    sprite.body.angularVelocity = 0;
  }

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
    fireBullet();
  }
  game.physics.arcade.collide(asteroids, sprite, collisionHandler, null, this);

  screenWrap(sprite);

  // ** CUSTOM CODE **
  if (activePlayer) {
    var me = Players.findOne({ _id: playerId });
    if (me && me.x === sprite.x && me.y === sprite.y && me.rotation === sprite.rotation) {
    } else if (me) {
      Players.update({_id: Session.get("userId")}, {$set: {
        x: sprite.x,
        y: sprite.y,
        rotation: sprite.rotation,
        createdAt: new Date()
      }});
    }
  }
}

function collisionHandler (asteriods, sprite) {
  sprite.kill();
  var explosion = explosions.getFirstExists(false);
  explosion.reset(sprite.body.x, sprite.body.y);
  explosion.play('explosion', 30, false, true);
}

function fireBullet () {
  if (game.time.now > bulletTime)
  {
    bullet = bullets.getFirstExists(false);

    if (bullet)
    {
      bullet.reset(sprite.body.x + 16, sprite.body.y + 16);
      bullet.lifespan = 2000;
      bullet.rotation = sprite.rotation;
      game.physics.arcade.velocityFromRotation(sprite.rotation, 400, bullet.body.velocity);
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
  for (key in players) {
    players[key].destroy();
  }

  var everyone = Players.find({_id: { $ne: playerId }});
  everyone.forEach(function(myDoc) {
    playerId = myDoc._id;
    var newSprite = game.add.sprite(myDoc.x, myDoc.y, 'ship');
    newSprite.rotation = myDoc.rotation;
    newSprite.anchor.set(0.5);

    players[playerId] = newSprite;
  });

}

function drawAsteroids() {
  Asteroids.find().forEach(function(ast) {
    asteroid = asteroids.create(ast.x, ast.y, 'asteroid');
    asteroid.body.velocity = new Phaser.Point(ast.xvel, ast.yvel);
    asteroid.body.collideWorldBounds=true;
    asteroid.body.bounce.setTo(1, 1);
  });
}
