var WIDTH = 1066;
var HEIGHT = 600;

currentPlayer = null;
var game;
var playerList = {}, asteroidsList = {};
var cursors, bullet, bulletTime = 0;
var bullets, flames, eballs, eballexplodes, asteroids, spaceships, explosions, space;
var asteroid, bullet;
var activePlayer = false;
var isUpdating = false;

var currentWeapon = 0;
var currentDamage = 1;

Template.meteoroid.helpers({
  score: function() {
    return Session.get("score");
  },
  weapon: function() {
    return Session.get("weapon");
  }
});

Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
});

Template.meteoroid.onRendered(function() {
  game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'meteoroid', { preload: preload, create: create, update: update, render: render });
  window.onbeforeunload = function() {
    Players.remove(currentPlayer._id);
    Meteor.call("ping", "Player has disconnected: " + currentPlayer._id);
  };
});

Template.meteoroid.events({
  "click #levelOne": function(event, template){
    Meteor.call("levelOne");
  },
  "click #levelTwo": function(event, template){
    Meteor.call("levelTwo");
  },
  "click #levelThree": function(event, template){
    Meteor.call("levelThree");
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
  game.load.image('fire', 'assets/games/asteroids/fire.png');
  game.load.spritesheet('flame', 'assets/games/asteroids/flame.png', 128, 128)
  game.load.spritesheet('explosion', 'assets/games/asteroids/explode.png', 128, 128);
  game.load.spritesheet('eball', 'assets/games/asteroids/eball.png', 96, 96);
  game.load.spritesheet('eballexplode', 'assets/games/asteroids/eballexplode.png', 96, 96);
}

function create() {
  Session.set("score", 0);

  game.stage.disableVisibilityChange = true;
  game.renderer.clearBeforeRender = false;
  game.renderer.roundPixels = true;
  game.physics.startSystem(Phaser.Physics.ARCADE);
  space = game.add.tileSprite(0, 0, game.width, game.height, 'space');

  asteroids = game.add.group();
  bullets = game.add.group();
  flames = game.add.group();
  eballs = game.add.group();
  eballexplodes = game.add.group();
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

  flames.enableBody = true;
  flames.physicsBodyType = Phaser.Physics.ARCADE;
  flames.createMultiple(3, 'flame');
  flames.setAll('anchor.x', 0.5);
  flames.setAll('anchor.y', 0.5);
  flames.forEach(function(flame) {
    flame.animations.add('flame');
  });

  eballs.enableBody = true;
  eballs.physicsBodyType = Phaser.Physics.ARCADE;
  eballs.createMultiple(5, 'eball');
  eballs.setAll('anchor.x', 0.5);
  eballs.setAll('anchor.y', 0.5);
  eballs.forEach(function(eball) {
    eball.animations.add('eball');
  });

  explosions.createMultiple(30, 'explosion');
  explosions.forEach(function(explosion) {
    explosion.anchor.x = 0.5;
    explosion.anchor.y = 0.5;
    explosion.animations.add('explosion');
  });

  eballexplodes.createMultiple(30, 'eballexplode');
  eballexplodes.forEach(function(eballexplode) {
    eballexplode.anchor.x = 0.5;
    eballexplode.anchor.y = 0.5;
    eballexplode.animations.add('eballexplode');
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
          asteroid.scale.set(fields.scale, fields.scale);
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
          fireBullet(fields.x, fields.y, fields.rotation, fields.owner, fields.type);
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

  game.input.keyboard.onUpCallback = function( e ){
      if(e.keyCode == Phaser.Keyboard.SHIFT){
        currentWeapon = (currentWeapon + 1) % 4;
        console.log(currentWeapon);
        Session.set("weapon", ["MultiBullets", "RapidBullets", "<span style='color: red'>Flamethrower</span>", "<span style='color: blue'>Ion Cannon</span>"][currentWeapon]);
      }
    };
}


function fireBullet (x, y, rotation, owner, type) {
  if (type === 1 || currentWeapon === 1) {
    if (game.time.now > bulletTime) {
      bullet = bullets.getFirstExists(false);

      if (bullet) {
        bullet.reset(x + 15, y + 15);
        bullet.lifespan = 2000;
        bullet.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation, 400, bullet.body.velocity);
        bulletTime = game.time.now + 50;

        if (owner === currentPlayer._id) {
          Bullets.remove(Bullets.insert({
          x: bullet.x,
          y: bullet.y,
          rotation: bullet.rotation,
          owner: currentPlayer._id,
          type: currentWeapon,
        }));
        }
      }
    }
  } else if (type === 0 || currentWeapon === 0) {
    if (game.time.now > bulletTime) {

      bullet1 = bullets.getFirstExists(false);
      if (bullet1) {
        bullet1.reset(x + 15, y + 15);
        bullet1.lifespan = 2000;
        bullet1.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation + 0.1, 400, bullet1.body.velocity);

        if (owner === currentPlayer._id) {
          Bullets.remove(Bullets.insert({
          x: bullet1.x,
          y: bullet1.y,
          rotation: bullet1.rotation,
          owner: currentPlayer._id,
          type: currentWeapon,
        }));
        }
      }

      bullet2 = bullets.getFirstExists(false);
      if (bullet2) {
        bullet2.reset(x + 15, y + 15);
        bullet2.lifespan = 2000;
        bullet2.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation, 400, bullet2.body.velocity);

        if (owner === currentPlayer._id) {
          Bullets.remove(Bullets.insert({
          x: bullet2.x,
          y: bullet2.y,
          rotation: bullet2.rotation,
          owner: currentPlayer._id,
          type: currentWeapon,
        }));
        }
      }

      bullet3 = bullets.getFirstExists(false);
      if (bullet3) {
        bullet3.reset(x + 15, y + 15);
        bullet3.lifespan = 2000;
        bullet3.rotation = rotation;
        game.physics.arcade.velocityFromRotation(rotation - 0.1, 400, bullet3.body.velocity);
        bulletTime = game.time.now + 500;

        if (owner === currentPlayer._id) {
          Bullets.remove(Bullets.insert({
          x: bullet3.x,
          y: bullet3.y,
          rotation: bullet3.rotation,
          owner: currentPlayer._id,
          type: currentWeapon,
        }));
        }
      }
    }
  } else if (type === 2 || currentWeapon === 2) {
    if (game.time.now > bulletTime) {
      bullet = flames.getFirstExists(false);

      if (bullet) {
        bullet.reset(x + 15, y + 15);
        bullet.lifespan = 2000;
        bullet.rotation = rotation;
        bullet.play('flame', 30, true, true);

        game.physics.arcade.velocityFromRotation(rotation, 400, bullet.body.velocity);
        bulletTime = game.time.now + 50;

        if (owner === currentPlayer._id) {
          Bullets.remove(Bullets.insert({
          x: bullet.x,
          y: bullet.y,
          rotation: bullet.rotation,
          owner: currentPlayer._id,
          type: currentWeapon,
        }));
        }
      }
    }
  } else if (type === 3 || currentWeapon === 3) {
    if (game.time.now > bulletTime) {
      bullet = eballs.getFirstExists(false);

      if (bullet) {
        bullet.reset(x + 15, y + 15);
        bullet.lifespan = 2000;
        bullet.rotation = rotation;
        bullet.play('eball', 30, true, true);

        game.physics.arcade.velocityFromRotation(rotation, 400, bullet.body.velocity);
        bulletTime = game.time.now + 50;

        if (owner === currentPlayer._id) {
          Bullets.remove(Bullets.insert({
          x: bullet.x,
          y: bullet.y,
          rotation: bullet.rotation,
          owner: currentPlayer._id,
          type: currentWeapon,
        }));
        }
      }
    }
  }
}

function checkCollisions() {
  game.physics.arcade.collide(asteroids, currentPlayer, spaceshipAsteroidHandler);
  game.physics.arcade.collide(asteroids, flames, flameAsteroidHandler);
  game.physics.arcade.collide(asteroids, bullets, bulletAsteroidHandler);
  game.physics.arcade.collide(asteroids, eballs, eballAsteroidHandler);
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
  
  if(Meteor.user()) {
    var username = Meteor.user().username;
    var score = Scoreboard.findOne(username);
    // console.log(score);
    
    if (score) {
      
      var oldScore = score.score;
      var newScore = Session.get("score");
      // console.log("existing score found, old: " + oldScore + " new: " + newScore);
      
      if (newScore > oldScore) {
        Scoreboard.update({_id: username}, {$set: {
          score: newScore,
          createdAt: new Date()
        }});
        // console.log("overwriting");
      }
    } else {
      // console.log("inserting new score");
      Scoreboard.insert({
        _id: username,
        score: Session.get("score"),
        createdAt: new Date()
      });
    }
  } else {
    // console.log("not logged in");
  }
  
  Session.set("score", 0);
}

function flameAsteroidHandler (asteroid, flame) {
  flame.kill()
  Asteroids.update(asteroid._id, {$inc: {health: -5}});
  playExplosion(asteroid.body.x, asteroid.body.y, 1.1);
  killAsteroidIfDead(asteroid);
}

function bulletAsteroidHandler (asteroid, bullet) {
  Asteroids.update(asteroid._id, {$inc: {health: -1}});
  playExplosion(asteroid.body.x, asteroid.body.y, 0.4);
  killAsteroidIfDead(asteroid);
}

function eballAsteroidHandler (asteroid, eball) {
  eball.kill()
  Asteroids.update(asteroid._id, {$inc: {health: -2}});
  var eballexplode = eballexplodes.getFirstExists(false);
  eballexplode.reset(asteroid.body.x, asteroid.body.y);
  eballexplode.play('eballexplode', 30, false, true);
  killAsteroidIfDead(asteroid);
}

function killAsteroidIfDead(asteroid) {
  var theAst = Asteroids.findOne(asteroid._id)
  if (theAst && theAst.health <= 0) {
    playExplosion(asteroid.body.x, asteroid.body.y);
    asteroid.kill();
    Asteroids.remove(asteroid._id);
    Session.set("score", Session.get("score") + 10);
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
