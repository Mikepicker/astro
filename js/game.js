var game = new Phaser.Game(800, 600, Phaser.AUTO, '',
  { preload: preload, create: create, update: update, render: render });

function preload()
{
    game.load.spritesheet('cargo', 'assets/cargo.png', 32, 32);
    game.load.spritesheet('eagle', 'assets/eagle.png', 32, 32);
    game.load.spritesheet('bumblebee', 'assets/bumblebee.png', 32, 32);
    game.load.spritesheet('lynx', 'assets/lynx.png', 16, 16);
    game.load.spritesheet('dock', 'assets/dock.png', 32, 32);
    game.load.spritesheet('button_upgrade', 'assets/button_upgrade.png', 32, 32);
    game.load.spritesheet('button_upgrade_disabled', 'assets/button_upgrade_disabled.png', 32, 32);
    game.load.spritesheet('explosion', 'assets/explosion.png', 16, 16);
    game.load.spritesheet('button_1', 'assets/button_1.png', 64, 32);
    game.load.spritesheet('button_2', 'assets/button_2.png', 64, 32);

    game.load.image('laser_1', 'assets/laser_1.png', 4, 8);
    game.load.image('laser_2', 'assets/laser_2.png', 32, 32);
    game.load.image('laser_3', 'assets/laser_3.png', 32, 32);
    game.load.image('satellite', 'assets/satellite.png', 32, 32);
    game.load.image('asteroid_1', 'assets/asteroid_1.png', 32, 32);
    game.load.image('asteroid_2', 'assets/asteroid_2.png', 32, 32);
    game.load.image('asteroid_small_1', 'assets/asteroid_small_1.png', 16, 16);
    game.load.image('asteroid_small_2', 'assets/asteroid_small_2.png', 16, 16);
    game.load.image('title', 'assets/title.png', 32, 160);
    game.load.image('tutorial', 'assets/tutorial.png');

    game.load.audio('explosion_1', 'sounds/explosion_1.wav');
    game.load.audio('explosion_2', 'sounds/explosion_2.mp3');
    game.load.audio('laser_1', 'sounds/laser_1.wav');
    game.load.audio('laser_2', 'sounds/laser_2.wav');
    game.load.audio('success', 'sounds/success.wav');
    game.load.audio('satellite', 'sounds/satellite.wav');
    game.load.audio('upgrade', 'sounds/upgrade.wav');
    game.load.audio('game_over', 'sounds/game_over.wav');
    game.load.audio('disabled', 'sounds/disabled.wav');
}

// Player 1 -> Mouse
// Player 2 -> Keyboard
var gameState = 'main_menu_state';
var title, button1, button2, tutorial, highScoreText, creditsText;  // Main Menu
var players, player1, player2;
var p1Bullets, p2Bullets;
var dock;
var satellites, asteroids;
var lastClick, attackClick;
var satellitesNumber;
var asteroidsNumber;
var asteroidSubdivisions = 2;
var explosions;
var cursors;
var button_upgrade;
var mineral = 0, level = 0;
var mineralText, levelText;
var mouseOnUI = false;
var mineralToUpgrade = 100;
var explosionSound1, explosionSound2, laserSound1,
  laserSound2, successSound, satelliteSound, upgradeSound, gameOverSound, disabledSound; // Sounds

function create()
{
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Screen Shake Plugin
    game.plugins.screenShake = game.plugins.add(Phaser.Plugin.ScreenShake);
    game.plugins.screenShake.setup({
     shakeX: true,
     shakeY: true
    });

    // Background
    game.stage.backgroundColor = '#0d354f';

    // Main Menu
    title = game.add.sprite(game.world.centerX-80, 128, 'title');
    button1 = game.add.button(game.world.centerX - 32,
      game.world.centerY - 64, 'button_1', function() { gameState = 'state_single'; toStateGame(); }, this);
    button2 = game.add.button(game.world.centerX - 32,
      game.world.centerY + 32, 'button_2', function() { gameState = 'state_multi'; toStateGame(); }, this);

    tutorial = game.add.sprite(game.world.centerX-100, game.world.centerY + 180, 'tutorial');

    // Dock
    dock = game.add.sprite(game.world.centerX, game.world.centerY, 'dock');
    game.physics.arcade.enable(dock);
    dock.anchor.set(0.5);
    dock.body.angularVelocity = 40;
    dock.animations.add('rotate', [0, 1, 2, 4], 2, true);
    dock.animations.play('rotate');

    // Satellites
    satellites = game.add.group();
    satellites.enableBody = true;
    satellites.physicsBodyType = Phaser.Physics.ARCADE;
    satellites.speed = 30;
    createSatellites();

    // Players group
    players = game.add.group();

    // Bullets
    p1Bullets = game.add.group();
    p1Bullets.enableBody = true;
    p1Bullets.physicsBodyType = Phaser.Physics.ARCADE;
    p1Bullets.createMultiple(30, 'laser_1');
    p1Bullets.setAll('anchor.x', 0.5);
    p1Bullets.setAll('anchor.y', 1);
    p1Bullets.setAll('outOfBoundsKill', true);
    p1Bullets.setAll('checkWorldBounds', true);
    p1Bullets.speed = 160 + level*2;

    p2Bullets = game.add.group();
    p2Bullets.enableBody = true;
    p2Bullets.physicsBodyType = Phaser.Physics.ARCADE;
    p2Bullets.createMultiple(30, 'laser_1');
    p2Bullets.setAll('anchor.x', 0.5);
    p2Bullets.setAll('anchor.y', 0.5);
    p2Bullets.setAll('outOfBoundsKill', true);
    p2Bullets.setAll('checkWorldBounds', true);
    p2Bullets.speed = 160 + level*2;

    // Asteroids
    asteroids = game.add.group();
    asteroids.enableBody = true;
    asteroids.physicsBodyType = Phaser.Physics.ARCADE;
    asteroids.speed = 30 + level*2;

    // Explosions
    explosions = game.add.group();
    explosions.createMultiple(30, 'explosion');
    explosions.setAll('anchor.x', 0.5);
    explosions.setAll('anchor.y', 0.5);

    // Right Mouse Click (P1 Attack)
    lastClick = new Phaser.Point();
    lastClick.x = -1;
    lastClick.y = -1

    // Left Mouse Click (P1 Move)
    attackClick = new Phaser.Point();
    attackClick.x = -1;
    attackClick.y = -1;

    // Enable mouse capture
    game.input.mouse.capture = true;

    // Disable default right-click behavior
    game.canvas.oncontextmenu = function (e) { e.preventDefault(); }

    // Enable cursors
    cursors = game.input.keyboard.createCursorKeys();

    // Create some game elements
    asteroidsNumber = 8;
    satellitesNumber = 4;
    createSatellites();

    // High Score
    if(typeof(Storage) !== "undefined")
    {
      if (localStorage.highScore === undefined)
        localStorage.setItem('highScore', 0);

      highScoreText = game.add.text(10, 0, 'High Score: ' +
        localStorage.highScore, { font: '30px Pixeltype', fill: '#fff'});
      highScoreText.setShadow(1, 1, 'rgba(0,0,0,1)', 1);
    }

    // Credits
    creditsText = game.add.text(game.width - 110, 0, '@Mikepicker',
      { font: '30px Pixeltype', fill: '#fff' });
    creditsText.setShadow(1, 1, 'rgba(0,0,0,1)', 1);

    // Sounds
    explosionSound1 = game.add.audio('explosion_1');
    explosionSound2 = game.add.audio('explosion_2');
    laserSound1 = game.add.audio('laser_1');
    laserSound2 = game.add.audio('laser_2');
    successSound = game.add.audio('success');
    satelliteSound = game.add.audio('satellite');
    upgradeSound = game.add.audio('upgrade');
    gameOverSound = game.add.audio('game_over');
    disabledSound = game.add.audio('disabled');
}

function update()
{
  // Ateroids Logic
  createAsteroids();
  asteroids.forEachAlive(function(asteroid) {
    screenWrap(asteroid);
  });

  if (gameState === 'main_menu_state')
    return;

  mouseX = game.input.x;
  mouseY = game.input.y;

  // Conditions to restart
  if (satellites.total === 0)
  {
    player1.kill();
    player2.kill();
    nextLevel();
  }

  // Player 1 Logic
  if (player1.alive)
  {
    // No AI
    if (gameState === 'state_multi')
    {
      // Movement
      if (!mouseOnUI && game.input.activePointer.rightButton.isDown)
      {
        lastClick.x = mouseX;
        lastClick.y = mouseY;
      }

      if (lastClick.x > 0)
      {
        player1.rotation = game.physics.arcade.angleToXY(player1, lastClick.x, lastClick.y) + 1.57079633;
        game.physics.arcade.moveToXY(player1, lastClick.x, lastClick.y, player1.speed);
        player1.play("move");
      }

      if (player1.position.distance(lastClick) < 5)
      {
          player1.body.velocity.x = 0;
          player1.body.velocity.y = 0;

          if (player1.animations.currentAnim.name != "idle")
            player1.play("idle");

          lastClick.x = -1;
          lastClick.y = -1;
      }

      // Fire
      if (!mouseOnUI && game.input.activePointer.leftButton.isDown)
        p1Fire(new Phaser.Point(mouseX, mouseY));
    }
    else // AI
    {
      // Get Satellite..
      if (player1.satellite === undefined)
      {
        var sat = satellites.getFirstExists();
        player1.rotation = game.physics.arcade.angleToXY(player1, sat.position.x, sat.position.y) + 1.57079633;
        game.physics.arcade.moveToObject(player1, sat, player1.speed);
        player1.play("move");
      }
      else // .. And bring it to the Dock!
      {
        if (player1.satellite.disappearing)
        {
          player1.body.velocity.x = 0;
          player1.body.velocity.y = 0;

          if (player1.animations.currentAnim.name != "idle")
            player1.play("idle");
        }
        else
        {
          player1.rotation = game.physics.arcade.angleToXY(player1, dock.x, dock.y) + 1.57079633;
          game.physics.arcade.moveToObject(player1, dock, player1.speed);
          player1.play("move");
        }
      }

      // Upgrade!
      onButtonUpgradeClick();
    }
  }

  // Player 2 Logic
  if (player2.alive)
  {
    if (cursors.up.isDown)
    {
      game.physics.arcade.accelerationFromRotation(player2.rotation-1.57079633, 200, player2.body.acceleration);
      player2.play("move");
    }
    else
    {
      player2.body.acceleration.set(0);
      player2.play("idle");
    }

    if (cursors.left.isDown)
        player2.body.angularVelocity = -250;
    else if (cursors.right.isDown)
        player2.body.angularVelocity = 250;
    else
        player2.body.angularVelocity = 0;

    screenWrap(player2);
    if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
        p2Fire();
  }

  // Satellites Logic
  satellites.forEachAlive(function(satellite) {
    if (satellite.hooked)
    {
      if (!player1.alive || player1.body.velocity.x == 0)
        satellite.body.velocity = new Phaser.Point(0,0);
      else
        game.physics.arcade.moveToObject(satellite, player1, satellites.speed);
    }
  });

  // Collisions
  game.physics.arcade.overlap(player1, satellites, collisionP1Satellite, null, this);
  game.physics.arcade.overlap(player1, dock, collisionP1Dock, null, this);
  game.physics.arcade.overlap(p1Bullets, asteroids, collisionBulletAsteroid, null, this);
  game.physics.arcade.overlap(p2Bullets, asteroids, collisionBulletAsteroid, null, this);
  game.physics.arcade.overlap(player1, asteroids, collisionPlayerAsteroid, null, this);
  game.physics.arcade.overlap(player2, asteroids, collisionPlayerAsteroid, null, this);

  // UI
  mineralText.text = "Mineral: " + mineral;
  levelText.text = "Level: " + level;

  if (gameState === 'state_multi')
  {
    if (player2.level === 2 || mineral < mineralToUpgrade)
      button_upgrade.loadTexture('button_upgrade_disabled');
    else
      button_upgrade.loadTexture('button_upgrade');
  }
}

function render()
{
    //game.debug.text(result, 10, 20);
}

function p1Fire(target)
{
    //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > player1.bulletTime)
    {
        //  Grab the first bullet we can from the pool
        bullet = p1Bullets.getFirstExists(false);

        if (bullet)
        {
            //  And fire it
            bullet.reset(player1.x, player1.y);
            bullet.damage = 2;
            bullet.rotation = game.physics.arcade.angleToXY(player1, target.x, target.y) + 1.57079633;
            game.physics.arcade.moveToXY(bullet, target.x, target.y, p1Bullets.speed);
            player1.bulletTime = game.time.now + 200;

            // Sound
            laserSound1.play();
        }
    }
}

function p2Fire()
{
    //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > player2.bulletTime)
    {
        //  Grab the first bullet we can from the pool
        bullet = p2Bullets.getFirstExists(false);

        if (bullet)
        {
          if (player2.level === 0)
          {
            bullet.loadTexture("laser_1", 0);
            bullet.damage = 2;
            bullet.width = 4;
            bullet.height = 8;
          }
          if (player2.level === 1)
          {
            bullet.loadTexture("laser_2", 0);
            bullet.damage = 4;
            bullet.width = 32;
            bullet.height = 32;
          }
          else if (player2.level > 1)
          {
            bullet.loadTexture("laser_3", 0);
            bullet.damage = 5;
            bullet.width = 32;
            bullet.height = 32;
          }

          //  And fire it
          bullet.reset(player2.x, player2.y);
          bullet.rotation = player2.rotation;
          game.physics.arcade.velocityFromRotation(player2.rotation - 1.57079633, p2Bullets.speed, bullet.body.velocity);
          player2.bulletTime = game.time.now + 200;

          // Sound
          laserSound2.play();
        }
    }
}

function screenWrap(sprite)
{
  if (sprite.x + sprite.width/2 < 0)
    sprite.x = game.width + sprite.width/2;
  else if (sprite.x - sprite.height/2 > game.width)
      sprite.x = -sprite.width/2;

  if (sprite.y + sprite.height/2 < 0)
      sprite.y = game.height + sprite.height/2;
  else if (sprite.y - sprite.height/2 > game.height)
      sprite.y = -sprite.height/2;
}

// UI Callbacks
function onButtonUpgradeClick()
{
  // Revive player2 if dead
  if (!player2.alive && mineral >= mineralToUpgrade)
  {
    mineral -= mineralToUpgrade;
    createPlayer2();
    upgradeSound.play();
  }
  else if (player2.level === 0 && mineral >= mineralToUpgrade)
  {
    player2.level += 1;
    player2.loadTexture('bumblebee', 0);
    mineral -= mineralToUpgrade;
    upgradeSound.play();
  }
  else if (player2.level === 1 && mineral >= mineralToUpgrade)
  {
    player2.level += 1;
    player2.loadTexture('eagle', 0);
    mineral -= mineralToUpgrade;
    upgradeSound.play();
  }
  else if (gameState === 'state_multi')
    disabledSound.play();
}

// Collisions
function collisionP1Satellite(player1, satellite)
{
  if (player1.satellite === undefined)
  {
    player1.satellite = satellite;
    satellite.hooked = true;
  }
}

function collisionP1Dock(player1, dock)
{
  if (player1.satellite != undefined && !player1.satellite.disappearing)
  {
    // Sound
    satelliteSound.play();

    player1.satellite.disappearing = true;
    var tween = game.add.tween(player1.satellite).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None)
      .start();
    tween.onComplete.add(function()
    {
      if (player1.satellite != undefined)
      {
        player1.satellite.kill();
        player1.satellite = undefined;
        mineral += 50;
      }
    }, this);
  }
}

function collisionBulletAsteroid(bullet, asteroid)
{
  asteroid.health -= bullet.damage;
  bullet.kill();

  if (asteroid.health <= 0)
  {
    asteroid.kill();
    explosion(bullet.position.x, bullet.position.y);
    mineral += 10;

    // Create Small Asteroids
    if (!asteroid.isSmall)
    {
      for (var i = 0; i < asteroidSubdivisions; i++)
      {
        var ast_sprite = Math.floor((Math.random() * 2) + 1);
        var ast = asteroids.create(asteroid.position.x, asteroid.position.y, 'asteroid_small_' + ast_sprite);
        ast.anchor.set(0.5);
        ast.body.angularVelocity = (Math.random()*100)+30;
        var randPoint = new Phaser.Point(Math.random()*game.width, Math.random()*game.height);
        game.physics.arcade.moveToXY(ast, randPoint.x, randPoint.y, asteroids.speed + Math.random()*10);
        ast.health = 5;
        ast.isSmall = true;
      }
    }
  }
}

function collisionPlayerAsteroid(player, asteroid)
{
  explosion(player.position.x, player.position.y);

  if (player === player1)
  {
    // Sound
    gameOverSound.play();

    player1.kill();
    player2.kill();

    // Store HighScore
    if(typeof(Storage) !== "undefined")
    {
      if (level > localStorage.highScore)
        localStorage.highScore = level;
    }

    restart();
  }
  else
    player.kill();
}

// Entities creation
function createPlayer1()
{
  player1 = game.add.sprite(400, 300, 'cargo');
  game.physics.arcade.enable(player1);
  player1.anchor.setTo(0.5, 0.5);
  player1.angle = 90;
  player1.animations.add('idle', [0, 1], 2, true);
  player1.animations.add('move', [2, 3], 2, true);
  player1.animations.play('idle');
  player1.bulletTime = 0;
  player1.speed = 30;
  player1.satellite = undefined;
  player1.body.velocity.setTo(0,0);
  player1.ai = gameState === 'state_multi' ? false : true;
  players.addChild(player1);
}

function createPlayer2()
{
  player2 = game.add.sprite(400, 350, 'lynx');
  game.physics.arcade.enable(player2);
  player2.anchor.set(0.5);
  player2.angle = 90;
  player2.animations.add('idle', [0], 2, true);
  player2.animations.add('move', [1, 2], 2, true);
  player2.animations.play('idle');
  player2.bulletTime = 0;
  player2.body.drag.set(100);
  player2.body.maxVelocity.set(200);
  player2.level = 0;
  player2.body.velocity = new Phaser.Point(0,0);
  players.addChild(player2);
}

function createAsteroids()
{
  var currLength = asteroids.total;
  for (var i = 0; i < asteroidsNumber-currLength; i++)
  {
    var ast_sprite = Math.floor((Math.random() * 2) + 1);
    var astX = Math.random() > 0.5 ? -32 : game.width+32;
    var astY = Math.random() > 0.5 ? -32 : game.height+32;
    var ast = asteroids.create(astX, astY, 'asteroid_' + ast_sprite);
    ast.anchor.set(0.5);
    ast.body.angularVelocity = (Math.random()*100)+30;
    var randPoint = new Phaser.Point(Math.random()*game.width, Math.random()*game.height);
    game.physics.arcade.moveToXY(ast, randPoint.x, randPoint.y, asteroids.speed + Math.random()*10);
    ast.health = 10;
    ast.isSmall = false;
  }
}

function createSatellites()
{
  satellites.removeAll();
  for (var i = 0; i < satellitesNumber; i++)
  {
    var off = 100;
    var sat = satellites.create((Math.random() * (game.width-off))+off,
      (Math.random() * (game.height-off))+off, 'satellite');
    sat.anchor.set(0.5);
    sat.body.angularVelocity = Math.random()*100;
    sat.hooked = false;
    sat.disappearing = false;
  }
}

function explosion(x,y)
{
  // Shake!
  game.plugins.screenShake.shake(10);

  // Boom!
  Math.random() > 0.5 ? explosionSound1.play() : explosionSound2.play();

  var expl;
  for (var i = 0; i < 5; i++)
  {
    expl = explosions.getFirstExists(false);

    if (expl)
    {
      var off = 15;
      expl.reset(x - off + (Math.random()*2*off) ,y - off + (Math.random()*2*off));
      expl.animations.add('explosion', [0, 1, 2, 3, 4, 5, 6, 7, 8], 10, false);
      expl.play('explosion', null, false, true);
    }
  }
}

function nextLevel()
{
  // Sound
  successSound.play();

  asteroids.forEachAlive(function(asteroid) { asteroid.kill(); });
  p1Bullets.forEachAlive(function(bullet) { bullet.kill(); });
  p2Bullets.forEachAlive(function(bullet) { bullet.kill(); });
  mineral = 0;
  level += 1;
  asteroidsNumber += 1;
  satellitesNumber += 1;

  createSatellites();
  createPlayer1();
  createPlayer2();
}

function restart()
{
  asteroids.forEachAlive(function(asteroid) { asteroid.kill(); });
  p1Bullets.forEachAlive(function(bullet) { bullet.kill(); });
  p2Bullets.forEachAlive(function(bullet) { bullet.kill(); });
  mineral = 0;
  level = 0;
  asteroidsNumber = gameState === 'state_single' ? 4 : 8;
  satellitesNumber = 2;

  createSatellites();
  createPlayer1();
  createPlayer2();
}

// States
function toStateGame()
{
  // Sound
  upgradeSound.play();

  // Kill main menu stuff
  title.kill();
  button1.kill();
  button2.kill();
  tutorial.kill();
  highScoreText.kill();
  creditsText.kill();

  // UI
  if (gameState === 'state_multi')
  {
    button_upgrade = game.add.button(game.world.centerX - 16,
      game.canvas.height - 40, 'button_upgrade', onButtonUpgradeClick, this);

    button_upgrade.onInputOver.add(function() { mouseOnUI = true; }, this);
    button_upgrade.onInputOut.add(function() { mouseOnUI = false; }, this);
  }

  mineralText = game.add.text(10, 0, 'Mineral: ' + mineral,
    { font: '30px Pixeltype', fill: '#fff'});
  mineralText.setShadow(1, 1, 'rgba(0,0,0,1)', 1);
  levelText = game.add.text(game.width - 100, 0, 'Level: ' + level,
    { font: '30px Pixeltype', fill: '#fff' });
  levelText.setShadow(1, 1, 'rgba(0,0,0,1)', 1);

  restart();
}
