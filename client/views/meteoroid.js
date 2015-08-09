/*

    ADD IN JAVASCRIPT CODE HERE.

    Rename and reorder these pages as necessary.

*/

Template.meteoroid.onRendered(function() {
    // add javascript to be executed when the template first_view is rendered
    var game = new Phaser.Game(1200, 1000, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

    function preload() {

        game.load.image('space', 'assets/skies/deep-space.jpg');
        game.load.image('bullet', 'assets/games/asteroids/bullets.png');
        game.load.image('ship', 'assets/games/asteroids/ship3.png');
        game.load.image('asteroid', 'assets/games/asteroids/asteroid.png');

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
        bullets.createMultiple(1, 'bullet');
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

        //  Game input
        cursors = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

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


        game.physics.arcade.collide(asteroids, sprite, blowUp, null, this);

        screenWrap(sprite);

        bullets.forEachExists(screenWrap, this);

    }

    function blowUp() {
        console.log("Blowing up");
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
    }

});
