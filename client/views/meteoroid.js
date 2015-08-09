var HEIGHT = 1066;
var WIDTH = 600;

var game, currentPlayer, players = {};
var cursors, bullet, bulletTime = 0;
var bullets, asteroids, spaceships, explosions;
var asteroid, bullet;
var activePlayer = false;

Template.meteoroid.onRendered(function() {
  game = new Phaser.Game(HEIGHT, WIDTH, Phaser.AUTO, 'meteoroid', { preload: preload, create: create, update: update, render: render });
  window.onbeforeunload = function() { Players.remove(currentPlayer._id); };
});

Template.meteoroid.events({
  "click #restart": function(event, template){
    Meteor.call("startGame", function(error, result){
      if(error){
        console.log("error", error);
      }
    });
  }
});

Template.meteoroid.onDestroyed(function(){
  Players.remove(currentPlayer._id);
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
  bullets = game.add.group();
  spaceships = game.add.group();
  explosions = game.add.group();

  setupCurrentPlayer();
  setupGroups();
  setupControls();
  setupObservers();
  setupColor();
}

function setupGroups() {
  asteroids.enableBody = true;
  asteroids.physicsBodyType = Phaser.Physics.ARCADE;

  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(20, 'bullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 0.5);

  spaceships.setAll('anchor.x', 0.5);
  spaceships.setAll('anchor.y', 0.5);

  explosions.createMultiple(30, 'explosion');
  explosions.forEach(function(explosion) {
    explosion.anchor.x = 0.5;
    explosion.anchor.y = 0.5;
    explosion.animations.add('explosion');
  });

  game.physics.arcade.enable(asteroids, Phaser.Physics.ARCADE);
  game.physics.arcade.enable(spaceships, Phaser.Physics.ARCADE);
}

function setupControls() {
  cursors = game.input.keyboard.createCursorKeys();
  game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
}

function setupCurrentPlayer() {
  currentPlayer = game.add.sprite(50, 50, 'ship');
  currentPlayer.anchor.setTo(0.5);
  // currentPlayer.tint = Math.random() * 0xffffff;
  game.physics.enable(currentPlayer, Phaser.Physics.ARCADE);
  currentPlayer.body.drag.set(100);
  currentPlayer.body.maxVelocity.set(400);
  currentPlayer.body.collideWorldBounds=true;
  currentPlayer.body.bounce.setTo(0.2,0.2);
}

function setupColor() {
  var colorArray = ['0xCCFFFF', '0xFFFF66', '0xFF6600', '0x66FF33']; //blue, yellow, orange, green
  for(var i = 0; i < colorArray.length; i++) {
    currentPlayer.tint = colorArray[i];    
  }
}

function setupObservers() {
  if (Players.find().count() >= 4) {
    alert("You may join, but others cannot see you");
  } else {
    activePlayer = true;
    currentPlayer._id = Players.insert({
      x: currentPlayer.x,
      y: currentPlayer.y,
      rotation: currentPlayer.rotation,
      createdAt: new Date()
    }, function() {
      Players.find().observeChanges({
        added: function(id, fields) {
          var player = this.spaceships.create(fields.x, fields.y, 'ship');
          player._id = id;
          player.rotation = fields.rotation;
          players[player._id] = player;
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
    });


    Asteroids.find().observeChanges({
      added: function(id, fields) {
        asteroid = asteroids.create(fields.x, fields.y, 'asteroid');
        asteroid._id = id;
        asteroid.body.velocity = new Phaser.Point(fields.xvel, fields.yvel);
        asteroid.body.collideWorldBounds=true;
        asteroid.body.bounce.setTo(1, 1);
      },
      removed: function(id) {
        asteroids.forEach(function(asteroid) {
          if (asteroid._id == id) {
            setTimeout(function(){
              if (asteroid) {
                playExplosion(asteroid.body.x, asteroid.body.y);
                asteroid.kill();
              }
            }, 500);
          }
        })
      }
    })
  }
}

function update() {
  checkControls();
  checkCollisions();
  checkPreventWrap();
  updateLocation();
}

function checkControls() {
  console.log(cursors);
  if (cursors.up.isDown) {
    game.physics.arcade.accelerationFromRotation(currentPlayer.rotation, 200, currentPlayer.body.acceleration);
  } else {
    currentPlayer.body.acceleration.set(0);
  }

  if (cursors.left.isDown) {
    currentPlayer.body.angularVelocity = -300;
  } else if (cursors.right.isDown) {
    currentPlayer.body.angularVelocity = 300;
  } else {
    currentPlayer.body.angularVelocity = 0;
  }

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
    fireBullet();
  }
}

function fireBullet () {
  if (game.time.now > bulletTime) {
    bullet = bullets.getFirstExists(false);

    if (bullet) {
      bullet.reset(currentPlayer.body.x + 15, currentPlayer.body.y + 15);
      bullet.lifespan = 2000;
      bullet.rotation = currentPlayer.rotation;
      game.physics.arcade.velocityFromRotation(currentPlayer.rotation, 400, bullet.body.velocity);
      bulletTime = game.time.now + 50;
    }
  }
}

function checkCollisions() {
  game.physics.arcade.collide(asteroids, currentPlayer, spaceshipAsteroidHandler);
  game.physics.arcade.collide(asteroids, spaceships, spaceshipAsteroidHandler);
  game.physics.arcade.collide(asteroids, bullets, bulletAsteroidHandler);
}

function spaceshipAsteroidHandler (spaceship, asteroid) {
  Asteroids.remove({_id: asteroid._id});
  asteroid.kill();
  playExplosion(spaceship.body.x, spaceship.body.y);
}

function bulletAsteroidHandler (bullets, asteroid) {
  console.log("open fire!");
}

function playExplosion(x, y) {
  var explosion = explosions.getFirstExists(false);
  explosion.reset(x, y);
  explosion.play('explosion', 30, false, true);
}

function checkPreventWrap () {
  console.log(currentPlayer);
  if (currentPlayer.x < 0) {
    currentPlayer.x = game.width;
  } else if (currentPlayer.x > game.width) {
    currentPlayer.x = 0;
  }

  if (currentPlayer.y < 0) {
    currentPlayer.y = game.height;
  } else if (currentPlayer.y > game.height) {
    currentPlayer.y = 0;
  }
}

function updateLocation() {
  if (activePlayer) {
    var me = Players.findOne({ _id: currentPlayer._id });
    if (me && me.x === currentPlayer.x && me.y === currentPlayer.y && me.rotation === currentPlayer.rotation) {
    } else if (me) {
      Players.update({_id: currentPlayer._id}, {$set: {
        x: currentPlayer.x,
        y: currentPlayer.y,
        rotation: currentPlayer.rotation,
        createdAt: new Date()
      }});
    }
  }
}

function render() {

}
