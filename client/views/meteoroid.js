Template.meteoroid.onRendered(function() {

    var game = new Phaser.Game(1066, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

    function preload() {

        game.load.image('space', 'assets/skies/deep-space.jpg');
        game.load.image('bullet', 'assets/games/asteroids/bullets.png');
        game.load.image('ship', 'assets/games/asteroids/ship3.png');
        game.load.image('asteroid', 'assets/games/asteroids/asteroid.png');
        game.load.spritesheet('explosion', 'assets/games/asteroids/explode.png', 128, 128);

    }

    var sprite;
    var cursors;

    var bullet;
    var bullets;
    var bulletTime = 0;
    var asteroid;
    var asteroids;
    var randomXPosition;
    var randomYPosition;
    var explosions;

    var players = {};
    var activePlayer = false;

    function create() {

        //  This will run in Canvas mode, so let's gain a little speed and display
        game.renderer.clearBeforeRender = false;
        game.renderer.roundPixels = true;

        //  We need arcade physics
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  A spacey background
        game.add.tileSprite(0, 0, game.width, game.height, 'space');

        // Create asteroid in random positions
        asteroids = game.add.group();
        asteroids.enableBody = true;
        asteroids.physicsBodyType = Phaser.Physics.ARCADE;

        for(var i = 0; i < 5; i++) {
            randomXPosition = Math.floor(Math.random() * 1000) + 100;
            randomYPosition = Math.floor(Math.random() * 800) + 100;
            asteroid = asteroids.create(randomXPosition, randomYPosition, 'asteroid');
            asteroid.body.collideWorldBounds=true;
            asteroid.body.bounce.setTo(0.1, 0.1);

        }

        game.physics.arcade.enable(asteroids, Phaser.Physics.ARCADE);

        //  Our ships bullets
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;

        //  Shoot 3 bullets at once
        bullets.createMultiple(3, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);

        //  Our player ship
        sprite = game.add.sprite(50, 50, 'ship');
        sprite.anchor.set(0.5);

        //  and its physics settings
        game.physics.enable(sprite, Phaser.Physics.ARCADE);

        sprite.body.drag.set(100);
        sprite.body.maxVelocity.set(400);
        sprite.body.collideWorldBounds=true;
        sprite.body.bounce.setTo(0.2,0.2);

        explosions = game.add.group();
        explosions.createMultiple(30, 'explosion');
        explosions.forEach(setupAsteroid, this);
        //  Game input
        cursors = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

        // ** CUSTOM CODE **
        var id = parseInt(Math.random() * 1000000).toString();
        Session.set("userId", id);
        // console.log("player " + Session.get("userId") + " at location (" + sprite.x + "," + sprite.y + ")");

        // Initialize database with location
        // console.log(Session.get("userId"));
        // console.log(sprite.x + sprite.y);
        if (Players.find().count() >= 4) {
          alert("You may join, but others cannot see you");
        } else {
          activePlayer = true;
          Players.insert({
            _id: Session.get("userId"),
            x: sprite.x,
            y: sprite.y,
            rotation: sprite.rotation,
            createdAt: new Date()
          });
        }
    }

    function update() {

        if (cursors.up.isDown)
        {
            game.physics.arcade.accelerationFromRotation(sprite.rotation, 200, sprite.body.acceleration);
        }
        else
        {
            sprite.body.acceleration.set(0);
        }

        if (cursors.left.isDown)
        {
            sprite.body.angularVelocity = -300;
        }
        else if (cursors.right.isDown)
        {
            sprite.body.angularVelocity = 300;
        }
        else
        {
            sprite.body.angularVelocity = 0;
        }

        if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
        {
            fireBullet();
        }
        game.physics.arcade.collide(asteroids, sprite, collisionHandler, null, this);

        screenWrap(sprite);

        bullets.forEachExists(screenWrap, this);

        // ** CUSTOM CODE **
        if (activePlayer) {
          Players.update({_id: Session.get("userId")}, {
            x: sprite.x,
            y: sprite.y,
            rotation: sprite.rotation,
            createdAt: new Date()
          });
        }
    }
    function setupAsteroid (asteroid) {
        asteroid.anchor.x = 0.5;
        asteroid.anchor.y = 0.5;
        asteroid.animations.add('explosion');

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

      if (sprite.x < 0)
      {
          sprite.x = game.width;
      }
      else if (sprite.x > game.width)
      {
          sprite.x = 0;
      }

      if (sprite.y < 0)
      {
          sprite.y = game.height;
      }
      else if (sprite.y > game.height)
      {
          sprite.y = 0;
      }
    }

    function render() {

      for (key in players) {
        players[key].destroy();
      }

      var everyone = Players.find({_id: { $ne: Session.get("userId") }});
      everyone.forEach(function(myDoc) {
        playerId = myDoc._id;
        var newSprite = game.add.sprite(myDoc.x, myDoc.y, 'ship');
        newSprite.rotation = myDoc.rotation;
        newSprite.anchor.set(0.5);

        players[playerId] = newSprite;
      });

    }
});
