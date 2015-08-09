// class MeteoroidGame {
//
//   constructor(width=1066, height=600, elementId='meteoroid') {
//     var callbacks = {
//       preload: () => {
//
//       create: () => {
//         this.game.renderer.clearBeforeRender = false;
//         this.game.renderer.roundPixels = true;
//         this.game.physics.startSystem(Phaser.Physics.ARCADE);
//         this.game.add.tileSprite(0, 0, game.width, game.height, 'space');
//
//         this.asteroids = this.game.add.group();
//         this.bullets = this.game.add.group();
//         this.explosions = this.game.add.group();
//         this.spaceships = this.game.add.group();
//
//         this.setupGroups();
//         this.setupControls();
//         this.setupCurrentPlayer();
//         this.setupObservers();
//       },
//       update: () => {
//         if (this.cursors && this.currentPlayer) {
//           this.checkControls();
//           this.checkCollisions();
//           this.checkPreventWrap();
//           this.updateLocation();
//         }
//       },
//       render: () => {
//
//       }
//     }
//     this.game = new Phaser.Game(width, height, Phaser.AUTO, elementId, callbacks);
//     this.players = {};
//   }
//
//   setupGroups() {
//     this.asteroids.enableBody = true;
//     this.asteroids.physicsBodyType = Phaser.Physics.ARCADE;
//
//     this.bullets.enableBody = true;
//     this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
//     this.bullets.createMultiple(1, 'bullet');
//     this.bullets.setAll('anchor.x', 0.5);
//     this.bullets.setAll('anchor.y', 0.5);
//
//     this.explosions.createMultiple(30, 'explosion');
//     this.explosions.forEach(function(explosion) {
//       explosion.anchor.x = 0.5;
//       explosion.anchor.y = 0.5;
//       explosion.animations.add('explosion');
//     });
//
//     this.game.physics.arcade.enable(this.asteroids, Phaser.Physics.ARCADE);
//     this.game.physics.enable(this.currentPlayer, Phaser.Physics.ARCADE);
//     this.game.phsyics.enable(this.players, Phaser.Physics.ARCADE);
//   }
//
//   setupControls() {
//     this.cursors = this.game.input.keyboard.createCursorKeys();
//     this.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
//   }
//
//   setupCurrentPlayer() {
//     this.currentPlayer = this.game.add.sprite(50, 50, 'ship');
//     this.currentPlayer.anchor.set(0.5);
//     this.currentPlayer.body.drag.set(100);
//     this.currentPlayer.body.maxVelocity.set(400);
//     this.currentPlayer.body.collideWorldBounds=true;
//     this.currentPlayer.body.bounce.setTo(0.2,0.2);
//   }
//
//   setupObservers() {
//     this.currentPlayer._id = Players.insert({
//       x: this.currentPlayer.x,
//       y: this.currentPlayer.y,
//       rotation: this.currentPlayer.rotation,
//     }, () => {
//       window.onbeforeunload = function() { Players.remove(this.currentPlayer._id); };
//
//       Players.find().observeChanges({
//         added: function(id, fields) {
//           player = this.spaceships.create(fields.x, fields.y, 'ship');
//           player._id = id;
//           player.rotation = fields.rotation;
//           player.anchor.set(0.5);
//           this.players[id] = player;
//         },
//         changed: function(id, fields) {
//           fields.x && (this.players[id].x = fields.x);
//           fields.y && (this.players[id].y = fields.y);
//           fields.rotation && (this.players[id].rotation = fields.rotation);
//         },
//         removed: function(id) {
//           this.players[id].destroy();
//         }
//       })
//     });
//     Asteroids.find().observeChanges({
//       added: function(id, fields) {
//         asteroid = this.asteroids.create(fields.x, fields.y, 'asteroid');
//         asteroid._id = id;
//         asteroid.body.velocity = new Phaser.Point(xvel, yvel);
//         asteroid.body.collideWorldBounds=true;
//         asteroid.body.bounce.setTo(1, 1);
//       },
//       removed: function(id) {
//         this.asteroids.forEach(function(asteroid) {
//           if (asteroid._id == id) {
//             setTimeout(function(){
//               if (asteroid) {
//                 this._playExplosion(asteroid.body.x, asteroid.body.y);
//                 asteroid.kill();
//               }
//             }, 500);
//           }
//         });
//       }
//     });
//   }
//
//   checkControls() {
//     if (this.cursors.up.isDown) {
//       this.game.physics.arcade.accelerationFromRotation(playerSpaceship.rotation, 200, playerSpaceship.body.acceleration);
//     } else {
//       this.currentPlayer.body.acceleration.set(0);
//     }
//
//     if (this.cursors.left.isDown) {
//       this.currentPlayer.body.angularVelocity = -300;
//     } else if (this.cursors.right.isDown) {
//       this.currentPlayer.body.angularVelocity = 300;
//     } else {
//       this.currentPlayer.body.angularVelocity = 0;
//     }
//
//     if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
//       // this.currentPlayer.fireBullet();
//     }
//   }
//
//   checkCollisions() {
//     this.game.physics.arcade.collide(this.asteroids, this.currentPlayer, this._collisionHandler);
//     this.game.physics.arcade.collide(this.asteroids, this.spaceships, this._collisionHandler);
//   }
//
//   checkPreventWrap() {
//     if (this.currentPlayer.x < 0) {
//       this.currentPlayer.x = this.game.width;
//     } else if (this.currentPlayer.x > this.game.width) {
//       this.currentPlayer.x = 0;
//     }
//
//     if (this.currentPlayer.y < 0) {
//       this.currentPlayer.y = this.game.height;
//     } else if (this.currentPlayer.y > this.game.height) {
//       this.currentPlayer.y = 0;
//     }
//   }
//
//   collisionHandler(spaceship, asteroid) {
//     Asteroids.remove({ _id: asteroid._id });
//     asteroid.kill();
//     this.playExplosion(spaceship.body.x, spaceship.body.y);
//   }
//
//   playExplosion(x, y) {
//     var explosion = this.explosions.getFirstExists(False);
//     explosion.reset(x, y);
//     explosion.play('explosion', 30, false, true);
//   }
//
//   updateLocation() {
//     Players.update(this.currentPlayer._id, {$set: {
//       x: this.currentPlayer.x,
//       y: this.currentPlayer.y,
//       rotation: this.currentPlayer.rotation
//     }});
//   }
// }
//
// this.MeteoroidGame = MeteoroidGame;
