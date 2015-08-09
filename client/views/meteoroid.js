var WIDTH = 1066;
var HEIGHT = 600;

currentPlayer = null;
var game;
var playerList = {}, asteroidsList = {};
var cursors, bullet, bulletTime = 0;
var bullets, asteroids, spaceships, explosions, space;
var asteroid, bullet;
var activePlayer = false;
var currentWeapon = 0;

var isUpdating = false;

Template.meteoroid.onRendered(function() {
  game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'meteoroid', { preload: preload, create: create, update: update, render: render });
  window.onbeforeunload = function() {
    Players.remove(currentPlayer._id);
    Meteor.call("ping", "Player has disconnected: " + currentPlayer._id);
  };
});

Template.meteoroid.events({
  "click #restart": function(event, template){
    Meteor.call("startGame", function(error, result){
      if(error){
        console.log("error", error);
      } else {
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
  game.stage.disableVisibilityChange = true;
  game.renderer.clearBeforeRender = false;
  game.renderer.roundPixels = true;
  game.physics.startSystem(Phaser.Physics.ARCADE);
  space = game.add.tileSprite(0, 0, game.width, game.height, 'space');

  asteroids = game.add.group();
  bullets = game.add.group();
  spaceships = game.add.group();
  explosions = game.add.group();

  setupCurrentPlayer();
  setupGroups();
  setupControls();
  setupObservers();
}

function setupGroups() {
  asteroids.enableBody = true;
  asteroids.physicsBodyType = Phaser.Physics.ARCADE;

  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(20, 'bullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 0.5);

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
  currentPlayer.tint = Math.random() * 0xffffff;
  game.physics.enable(currentPlayer, Phaser.Physics.ARCADE);
  currentPlayer.body.drag.set(100);
  currentPlayer.body.maxVelocity.set(400);
  currentPlayer.body.collideWorldBounds=true;
  currentPlayer.body.bounce.setTo(0.2,0.2);
}

function setupObservers() {
  // if (Players.find().count() == 0) {
  //   isHost = true;
  //   console.log('Im the host!');
  // }
  if (Players.find().count() >= 4) {
    alert("You may join, but others cannot see you");
  } else {
    activePlayer = true;
    currentPlayer._id = Players.insert({
      x: currentPlayer.x,
      y: currentPlayer.y,
      rotation: currentPlayer.rotation,
      status: 'alive',
      createdAt: new Date(),
      tint: currentPlayer.tint
    }, function() {
      Meteor.call("ping", "Player has connected: " + currentPlayer._id);
      Players.find().observeChanges({
        added: function(id, fields) {
          if (id !== currentPlayer._id) {
            addPlayer(id, fields.x, fields.y, fields.rotation, fields.tint);
          } else if (fields.isHost){
            isHost = true;
          }
        },
        changed: function(id, fields) {
          if (id !== currentPlayer._id) {
            var player = playerList[id];
            fields.x && (player.x = fields.x);
            fields.y && (player.y = fields.y);
            fields.rotation && (player.rotation = fields.rotation);
            if (fields.status == 'dead') {
              playExplosion(player.x, player.y);
              player.kill();
            }
            else if (fields.status == 'reset'){
              if (player) {
                player.x = fields.x;
                player.y = fields.y;
              }
              else {
                player = Players.findOne(id);
                addPlayer(id, player.x, player.y, player.rotation, player.tint);
                Players.update(id, {$set: { status: 'alive' }});
              }
            }
          }
          else if (fields.status == 'reset') {
            currentPlayer.kill();
            setupCurrentPlayer();
            currentPlayer._id = id;
            fields.x ? currentPlayer.x = fields.x : currentPlayer.x = 50;
            fields.y ? currentPlayer.y = fields.y : currentPlayer.y = 50;
            console.log(fields);
            Players.update(id, {$set: { status: 'alive' }});
          }
        },
        removed: function(id) {
          playerList[id].destroy();
        }
      });

      function addPlayer(id, x, y, rotation, tint) {
        var player = spaceships.create(x, y, 'ship');
        player._id = id;
        player.rotation = rotation;
        player.tint = tint;
        player.anchor.setTo(0.5);
        playerList[id] = player;
      }

      Asteroids.find().observeChanges({
        added: function(id, fields) {
          asteroid = asteroids.create(fields.x, fields.y, 'asteroid');
          asteroid._id = id;
          asteroid.body.velocity = new Phaser.Point(fields.xvel, fields.yvel);
          asteroid.body.collideWorldBounds=true;
          asteroid.body.bounce.setTo(1, 1);
          asteroidsList[id] = asteroid;
        },
        changed: function(id, fields) {
          // fields.x && (asteroidsList[id].x = fields.x);
          // fields.y && (asteroidsList[id].y = fields.y);
          if (fields.x && fields.y) {
            asteroidsList[id].reset(fields.x, fields.y);
          }
          if (fields.xvel && fields.yvel) {
            asteroidsList[id].body.newVelocity = new Phaser.Point(fields.xvel, fields.yvel);
          }
        },
        removed: function(id) {
          setTimeout(function(){
            if (asteroidsList[id]) {
              playExplosion(asteroidsList[id].body.x, asteroidsList[id].body.y);
              asteroidsList[id].kill();
            }
          }, 500);
        }
      });

      Bullets.find().observeChanges({
        added: function(id, fields) {
          fireBullet(fields.x, fields.y, fields.rotation);
        }
      })
    });
  }
}

function update() {
  space.tilePosition.y += 2;
  checkControls();
  checkCollisions();
  checkPreventWrap();
  updateData();
}

function checkControls() {
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
    fireBullet(currentPlayer.body.x, currentPlayer.body.y, currentPlayer.rotation);
  }
  
  if (game.input.keyboard.isDown(Phaser.Keyboard.SHIFT)) {
    currentWeapon = (currentWeapon + 1) % 3;
  }
}

function fireBullet (x, y, rotation) {
  if (currentWeapon === 1) {
    console.log(0);
    if (game.time.now > bulletTime) {
      bullet = bullets.getFirstExists(false);

      if (bullet) {
        bullet.reset(x + 15, y + 15);
        bullet.lifespan = 2000;
        bullet.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation, 400, bullet.body.velocity);
        bulletTime = game.time.now + 50;

        Bullets.insert({
          x: bullet.x,
          y: bullet.y,
          rotation: bullet.rotation,
        });
      }
    }
  } else if (currentWeapon === 0) {
    console.log(1);
    if (game.time.now > bulletTime) {
      
      bullet1 = bullets.getFirstExists(false);
      if (bullet1) {
        bullet1.reset(x + 15, y + 15);
        bullet1.lifespan = 2000;
        bullet1.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation + 0.1, 400, bullet1.body.velocity);

        Bullets.insert({
          x: bullet1.x,
          y: bullet1.y,
          rotation: bullet1.rotation,
        });
      }
      
      bullet2 = bullets.getFirstExists(false);
      if (bullet2) {
        bullet2.reset(x + 15, y + 15);
        bullet2.lifespan = 2000;
        bullet2.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation, 400, bullet2.body.velocity);

        Bullets.insert({
          x: bullet2.x,
          y: bullet2.y,
          rotation: bullet2.rotation,
        });
      }
      
      bullet3 = bullets.getFirstExists(false);
      if (bullet3) {
        bullet3.reset(x + 15, y + 15);
        bullet3.lifespan = 2000;
        bullet3.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation - 0.1, 400, bullet3.body.velocity);
        bulletTime = game.time.now + 500;

        Bullets.insert({
          x: bullet3.x,
          y: bullet3.y,
          rotation: bullet3.rotation,
        });
      }
    }
  }
}

function checkCollisions() {
  game.physics.arcade.collide(asteroids, currentPlayer, spaceshipAsteroidHandler);
  // game.physics.arcade.collide(asteroids, spaceships, spaceshipAsteroidHandler);
  game.physics.arcade.collide(asteroids, bullets, bulletAsteroidHandler);
}

function spaceshipAsteroidHandler (spaceship, asteroid) {
  playExplosion(spaceship.body.x, spaceship.body.y);
  handleAsteroidBounce(asteroid);
  spaceship.kill();
  asteroid.kill();
  Players.update(currentPlayer._id, {$set: {
    status: 'dead'
  }});
  Asteroids.remove(asteroid._id);
}

function bulletAsteroidHandler (asteroid, bullets) {
  Asteroids.update(asteroid._id, {$inc: {health: -1}});
  playExplosion(asteroid.body.x, asteroid.body.y, 0.4);
  if (Asteroids.findOne(asteroid._id).health <= 0) {
    playExplosion(asteroid.body.x, asteroid.body.y);
    asteroid.kill();
    Asteroids.remove(asteroid._id);
  }
}

function playExplosion(x, y, scale) {
  scale = scale || 1;
  var explosion = explosions.getFirstExists(false);
  explosion.scale.set(scale, scale);
  explosion.reset(x, y);
  explosion.play('explosion', 30, false, true);
}

function handleAsteroidBounce(asteroid) {
  isUpdating = true;
  setTimeout(function(){
      isUpdating = false;
  }, 400);
}

function checkPreventWrap () {
  // console.log(currentPlayer);
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

function updateData() {
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

    if (isUpdating) {
      for (var i in asteroidsList) {
        var asteroid = asteroidsList[i];
        Asteroids.update(asteroid._id, {$set: {
          x: asteroid.x,
          y: asteroid.y,
          xvel: asteroid.body.velocity.x,
          yvel: asteroid.body.velocity.y
        }});
      }
    }
  }
}

function render() {

}
