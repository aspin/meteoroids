/*

    ADD IN JAVASCRIPT CODE HERE.

    Rename and reorder these pages as necessary.

*/

Template.meteoroid.onRendered(function() {
    // add javascript to be executed when the template first_view is rendered
    var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });
    
    function preload() {

        game.load.image('space', 'assets/skies/deep-space.jpg');
        game.load.image('bullet', 'assets/games/asteroids/bullets.png');
        game.load.image('ship', 'assets/games/asteroids/ship.png');

    }

    var sprite;
    var cursors;

    var bullet;
    var bullets;
    var bulletTime = 0;

    function create() {

        //  This will run in Canvas mode, so let's gain a little speed and display
        game.renderer.clearBeforeRender = false;
        game.renderer.roundPixels = true;

        //  We need arcade physics
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  A spacey background
        game.add.tileSprite(0, 0, game.width, game.height, 'space');

        //  Our ships bullets
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;

        //  All 40 of them
        bullets.createMultiple(40, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);

        //  Our player ship
        sprite = game.add.sprite(300, 300, 'ship');
        sprite.anchor.set(0.5);

        //  and its physics settings
        game.physics.enable(sprite, Phaser.Physics.ARCADE);

        sprite.body.drag.set(100);
        sprite.body.maxVelocity.set(200);

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
        Players.insert({
          _id: Session.get("userId"),
          x: sprite.x,
          y: sprite.y,
          createdAt: new Date()
        });

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

        screenWrap(sprite);

        bullets.forEachExists(screenWrap, this);
        
        // ** CUSTOM CODE **
        var me = Players.findOne({_id: Session.get("userId")});
        if (me.x === sprite.x && me.y === sprite.y) {
          // console.log("Not moving, no update");
        } else {
          Players.update(Session.get("userId"), {
            x: sprite.x,
            y: sprite.y,
            createdAt: new Date()
          });
        }
        
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
