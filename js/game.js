(function() {

    var env = {
        friction: 0.01,
        gravity: {
            x: 0,
            y: 0
        },
        tilesize: 30,
        enetitySize: 25,
        enemysize: 25
    };

    var Entity = function(x, y) {
        this.x = x;
        this.y = y;

        this.xacc = 0;
        this.yacc = 0;

        this.xvel = 0;
        this.yvel = 0;
    };

    Entity.prototype.apply_force = function (force) {
            this.xacc += force.x;
            this.yacc += force.y;
    };

    Entity.prototype.updatex = function() {
        this.xvel += this.xacc;
        this.x += this.xvel;
        this.xacc = 0;
    };

    Entity.prototype.updatey = function() {
        this.yvel += this.yacc;
        this.y += this.yvel;
        this.yacc = 0;
    };

    var Player = function(x, y) {
        this.x = x;
        this.y = y;
        this.jumpForce = {x: 0, y: -1};
        this.bbox = {x: x, y: y, width: env.enetitySize, height: env.enetitySize};
    }

    Player.prototype = new Entity();

    Player.prototype.update_player = function() {
        this.apply_force({x: -1 * env.friction * this.xvel, y: -1 * env.friction * this.yvel});//apply friction
        this.apply_force(env.gravity);
        this.bbox.x = this.x;
        this.bbox.y = this.y;
    };

    var Enemy = function(x, y) {
        this.x = x;
        this.y = y;
        this.bbox = {x: x, y: y, width: env.enetitySize, height: env.enetitySize};
    }

    Enemy.prototype = new Player();

    var Game = function () {
        this.map = [[1,1,1,1,1,1,1,1,1,1,1,1,1],
                     [1,0,0,0,0,0,0,0,0,0,0,0,1],
                     [1,0,0,1,0,0,0,1,0,0,1,1,1],
                     [1,0,1,0,0,0,0,1,0,0,0,0,0],
                     [1,0,1,0,0,0,0,1,0,0,0,0,0],
                     [1,0,1,0,0,0,0,0,0,0,0,0,1],
                     [1,0,1,0,0,0,0,1,0,0,0,0,1],
                     [1,0,1,2,0,0,0,1,0,0,0,3,1],
                     [1,1,1,1,1,1,1,1,1,1,1,1,1]];

        this.running = true;
        this.player = new Player(30, 30);

        this.commands = [];
        this.enemies = [];

        this.lost = false;
        this.won = false;

        for(var y=0; y<this.map.length; y++) {
            for(var x=0; x<this.map[y].length; x++) {
                if(this.map[y][x] == 2) {
                    this.enemies.push(new Enemy(x* env.tilesize, y * env.tilesize));
                }
            }
        }

        this.update = function() {
            if(this.won) {
                document.getElementById('overlay').style.opacity = 0.5;
                document.getElementById('end_message').innerHTML = 'SUCCESS';
            } else if(this.lost) {
                document.getElementById('overlay').style.opacity = 0.5;
                document.getElementById('end_message').innerHTML = 'FAILURE';
            }
            while(this.commands.length > 0) {
                this.commands[0].execute(this.player);
                this.commands.shift();
            }
            this.update_player();
            this.update_enemies();

            //check entity collisions
            for(var i=0; i<this.enemies.length; i++) {
                if(this.check_entity_collisions(this.player, this.enemies[i])) {
                    this.lost = true;
                }
            }
        };

        this.update_enemy = function(enemy) {
            enemy.update_player();
            var tempx = enemy.x;
            var tempy = enemy.y;

            enemy.updatex();
            if(this.check_collisions(enemy, 1)) {
                enemy.x = tempx;
                enemy.xvel = 0;
            }
            
            enemy.updatey();
            if(this.check_collisions(enemy, 1)) {
                enemy.y = tempy;
                enemy.yvel = 0;
            }

            if(this.check_collisions(enemy, 3) && !this.lost) {
                this.won = true;
            }
        };

        this.update_enemies = function() {
            for(var i=0; i<this.enemies.length; i++) {
                var playerDistance = dist(this.enemies[i], this.player);
                var vector = {
                    x: this.player.x - this.enemies[i].x,
                    y: this.player.y - this.enemies[i].y
                }
                vector.x /= (playerDistance * 10);
                vector.y /= (playerDistance * 10);

                this.enemies[i].apply_force(vector);
                this.update_enemy(this.enemies[i]);
            }
        }

        this.update_player = function() {
            this.player.update_player();
            var tempx = this.player.x;
            var tempy = this.player.y;

            this.player.updatex();
            if(this.check_collisions(this.player, 1)) {
                this.player.x = tempx;
                this.player.xvel = 0;
            }
            
            this.player.updatey();
            if(this.check_collisions(this.player, 1)) {
                this.player.y = tempy;
                this.player.yvel = 0;
            }

            if(this.check_collisions(this.player, 3) && !this.won) {
                this.lost = true;
            }
        };

        this.check_collisions = function(p, value) {
            for(var y=0; y<game.map.length; y++) {
                for(var x=0; x<game.map[y].length; x++) {
                    if(this.map[y][x] == value) {
                        tilebox =  {x: x * env.tilesize, y: y * env.tilesize, width: env.tilesize, height: env.tilesize};
                        if(boxCollision({x: p.x, y: p.y, width: env.enetitySize, height: env.enetitySize}, tilebox)) {
                            return true;
                        }
                    }
                }
            }

        };

        this.check_entity_collisions = function(player, follower) {
            if(boxCollision(player.bbox, follower.bbox)) {
                return true;
            }

            return false;
        }
    };

    var makePlayerMoveCommand = function(player, x, y) {
        return {
            execute: function() {
                player.apply_force({x:x, y:y});
            }
        };
    };

    var makePlayerAttackCommand = function(player) {
        return {
            execute: function() {
                player.attack();
            }
        };
    };

    var makePlayerJumpCommand = function(player) {
        return {
            execute: function() {
                player.apply_force(player.jumpForce);
            }
        }
    }

    //keeps track of which keys are pressed at all times
    var InputHandler = function() {
        this.pressed_keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false
        };

        this.key_codes = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            32: 'space',

            65: 'left',
            87: 'up',
            83: 'down',
            68: 'right'
        };
    };

    var handleInput = function(inputHandler, game) {
        if(inputHandler.pressed_keys['up']) {
            game.commands.push(makePlayerMoveCommand(game.player, 0, -0.1));
        }
        if(inputHandler.pressed_keys['down']) {
            game.commands.push(makePlayerMoveCommand(game.player, 0, 0.1))
        }
        if(inputHandler.pressed_keys['left']) {
            game.commands.push(makePlayerMoveCommand(game.player, -0.1, 0));
        }
        if(inputHandler.pressed_keys['right']) {
            game.commands.push(makePlayerMoveCommand(game.player, 0.1, 0));
        }
        if(inputHandler.pressed_keys['space']) {
            game.commands.push(makePlayerJumpCommand(game.player));
        }
    };

    var render = function(game, ctx) {
        ctx.lineWidth = 0;
        ctx.fillStyle = 'black';
        ctx.clearRect(0, 0, 640, 480);

        //draw player
        ctx.beginPath();
        ctx.arc(game.player.x + game.player.bbox.width/2, game.player.y + game.player.bbox.height/2, 10, 0, 2* Math.PI, false);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'red';

        //draw enemies
        for(var i=0; i<game.enemies.length; i++) {
            ctx.beginPath();
            ctx.arc(game.enemies[i].x + game.enemies[i].bbox.width/2, game.enemies[i].y + game.enemies[i].bbox.height/2, 10, 0, 2* Math.PI, false);
            ctx.fill();
            ctx.stroke();
        }

        for(var y=0; y<game.map.length; y++) {
            for(var x=0; x<game.map[y].length; x++) {
                if(game.map[y][x] == 1) {
                    context.beginPath();
                    context.rect(x * env.tilesize, y * env.tilesize, env.tilesize, env.tilesize);
                    context.fillStyle = 'yellow';
                    context.fill();
                    context.lineWidth = 7;
                    context.strokeStyle = 'black';
                    context.stroke();
                } else if(game.map[y][x] == 3) {
                    context.beginPath();
                    context.rect(x * env.tilesize, y * env.tilesize, env.tilesize, env.tilesize);
                    context.fillStyle = 'yellow';
                    context.fill();
                    context.lineWidth = 7;
                    context.strokeStyle = 'green';
                    context.stroke();
                }
            }
        }
    };

    var context = document.getElementById('canvas').getContext('2d');
    var game = new Game();

    var inputHandler = new InputHandler();

    var updateAndRender = function () {
        handleInput(inputHandler, game);
        game.update();
        render(game, context);
    };

    var boxCollision = function(a, b) {
        if((a.x + a.width > b.x && a.x < b.x + b.width) && (a.y + a.height > b.y && a.y < b.y + b.height)) {
            return true;
        } else {
            return false;
        }
    };

    var getCollisionForce = function(player, box) {
        var playercenterx = player.x + (player.bbox.width / 2);
        var playercentery = player.y + (player.bbox.height / 2);

        var boxcenterx = box.x + (box.width / 2);
        var boxcentery = box.y + (box.height / 2);

        var dx = playercenterx - boxcenterx;
        var dy = playercentery - boxcentery;

        if(dy*dy > dx*dx) {
            return {x: 0, y: -player.yvel*1.5};
        } else {
            return {x: -player.xvel*1.5, y:0};
        }
    };

    var dist = function(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    };

    setInterval(updateAndRender, 1000 / 60);

    window.onkeydown = function(event) {
        inputHandler.pressed_keys[inputHandler.key_codes[event.keyCode]] = true;
    };

    window.onkeyup = function(event) {
        inputHandler.pressed_keys[inputHandler.key_codes[event.keyCode]] = false;
    };
})();