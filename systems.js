const entities = require('./entities');

function HealthSystem(debug=false) {
    this.filter = ['health'];
    this.debug = debug;
    this.process = function(ecs) {
        let guids = ecs.filter(...this.filter);
        this.debug && console.log(`running health on ${ecs.names(guids)}`);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            let health = entity.health;
            // regenerate health
            if (health.current && health.regen && health.base) {
                health.current = Math.min(health.base, health.current + health.regen);
                if (health.current === health.base) {
                    this.debug && console.log(`entity ${entity.guid} is at max health!`);
                }
            }
        }
    }
}

function VelocitySystem(debug=false) {
    this.filter = ['position', 'velocity'];
    this.debug = debug;
    this.process = function(ecs) {
        let guids = ecs.filter(...this.filter);
        this.debug && console.log(`running physics on ${ecs.names(guids)}`);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            // apply friction
            if (entity.friction) {
                entity.velocity.x *= 1 - entity.friction;
                entity.velocity.y *= 1 - entity.friction;
            }
            // apply velocity
            entity.position.x += entity.velocity.x;
            entity.position.y += entity.velocity.y;
            this.debug && console.log(`entity guid ${guid} with pos ${entity.position.x}, ${entity.position.y}`);
        }
    }
}
function BlankSystem(debug=false) {
    this.filter = [];
    this.debug = debug;
    this.process = function(ecs) {
        let guids = ecs.filter(...this.filter);
        this.debug && console.log(`running blank on ${ecs.names(guids)}`);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            this.debug && console.log(``);
        }
    }
}

// TODO: put this somewhere else
const rand = (min, max) => Math.random() * (max - min) + min;

function StarSpawnerSystem(debug=false) {
    this.debug = debug;
    this.cooldown = 10;
    this.process = function(ecs) {
        // HACK: seriously?
        // let gameStateGuid = Array.from(ecs.filter('gameState'))[0];
        // HACK: ugly naming, perhaps more granularity is needed
        let gameState = ecs.hash[ecs.getFirst('gameState')].gameState;
        // this.debug && console.log(`found gameState: ${gameState}`);
        // this.debug && console.log(`found starSpawner: ${starSpawner}`);
        let { xMin, yMin, xMax, yMax } = gameState;
        this.cooldown = Math.max(this.cooldown - 1, 0);
        if (this.cooldown === 0) {
            // new cooldown
            this.cooldown = ~~rand(2, 10);
            let closeness = rand(0.1, 1);
            let star = entities.makeStar(xMax, rand(yMin, yMax), -closeness*30, 0, closeness*5, closeness*5, 'white');
            ecs.addEntity(star);
        }
        this.debug && console.log(`bounds:`, xMin, yMin, xMax, yMax);
    }
}

function OutOfBoundsSystem(debug=false) {
    this.filter = ['position'];
    this.debug = debug;
    this.process = function(ecs) {
        let gameState = ecs.hash[ecs.getFirst('gameState')].gameState;
        let { xMin, yMin, xMax, yMax } = gameState;
        let guids = ecs.filter(...this.filter);
        this.debug && console.log(`running OOBSystem on ${ecs.names(guids)}`);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            let { x, y } = entity.position;
            if (x < xMin || x > xMax || y < yMin || y > yMax) {
                if (entity.player) {
                    let velocity = entity.velocity;
                    let { w, h } = entity.collision.box;
                    // player gets bounced back
                    x - w < xMin && (velocity.x = 5);
                    x + w > xMax && (velocity.x = -5);
                    y - h < yMin && (velocity.y = 5);
                    y + h > yMax && (velocity.y = -5);
                } else {
                    // all else gets deleted
                    entity.dead = true;
                }
            }
        }
    }
}
function CleanupSystem(debug=false) {
    this.filter = ['dead'];
    this.debug = debug;
    this.process = function(ecs) {
        let guids = ecs.filter(...this.filter);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            if (entity.render && entity.render.svg) entity.render.svg.remove();
            ecs.removeEntity(entity);
        }
    }

}
function BoxRenderSystem(svg, debug=false) {
    function svgRect(svg, x, y, w, h, fill='blue') {
        return svg.append(`rect`)
            .attrs({'width':w, 'height':h, 'fill':fill})
            .attr('transform', getTransform(x-w/2, y-h/2))
        // return svg.append('circle')
        //         .attrs({'cx':x, 'cy':y, 'r':10, 'fill':fill})
    }
    const getTransform = (x, y, ang=0, scale=1) => `translate(${x} ${y})` + `rotate(${ang})` + `scale(${scale})`;

    this.filter = ['render', 'position'];
    this.debug = debug;
    this.process = function(ecs) {
        let guids = ecs.filter(...this.filter);
        this.debug && console.log(`running blank on ${ecs.names(guids)}`);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            let { w, h, fill } = entity.render;
            let { x, y } = entity.position;
            if (!entity.render.svg) {
                // first time init
                entity.render.svg = svgRect(svg, x - w/2, y - h/2, w, h, fill);
            } else {
                // update render
                entity.render.svg.attr('transform', getTransform(x - w/2, y - h/2));
            }
            this.debug && console.log(``);
        }
    }
}

function CollisionSystem(debug=false) {
}

function InitBackgroundSystem(svg, debug=false) {
    this.filter = ['gameState'];
    this.debug = debug;
    this.svg = svg;
    this.process = function(ecs) {
        let guids = ecs.filter(...this.filter);
        this.debug && console.log(`running gameBorder on ${ecs.names(guids)}`);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            if (!entity.gameState.initDone) {
                let { xMin, yMin, xMax, yMax, windowWidth, windowHeight } = entity.gameState;
                let { svg } = this;
                // background
                svg.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', windowWidth)
                    .attr('height', windowHeight)
                    .attr('fill', 'black');
                let gameW = xMax - xMin;
                let gameH = yMax - yMin;
                // draw borders
                let thickness = 5
                // top
                svg.append('rect').attrs({'x': xMin, 'y': yMin, 'width': gameW, 'height': thickness, 'fill' :'white'});
                // bottom
                svg.append('rect').attrs({'x': xMin, 'y': yMax, 'width': gameW, 'height': thickness, 'fill' :'white'});
                // left
                svg.append('rect').attrs({'x': xMin, 'y': yMin, 'width': thickness, 'height': gameH, 'fill' :'white'});
                // right
                svg.append('rect').attrs({'x': xMax, 'y': yMin, 'width': thickness, 'height': gameH + thickness, 'fill' :'white'});
                entity.gameState.initDone = true;
            }
            this.debug && console.log(``);
        }
    }

}

function ApplyInputSystem(keysDown) {
    
    const KEY_W = 87,
        KEY_S = 83,
        KEY_A = 65,
        KEY_D = 68,
        KEY_UP = 38,
        KEY_DOWN = 40,
        KEY_LEFT = 37,
        KEY_RIGHT = 39,
        KEY_Q = 81,
        KEY_E = 69,
        KEY_SPACE = 32;
    this.process = function(ecs) {
        let playerEntity = ecs.hash[ecs.getFirst('player')];
        // thrust
        if (keysDown[KEY_W] && playerEntity.velocity.y > -10) {
            playerEntity.velocity.y -= 2;
        }
        if (keysDown[KEY_S] && playerEntity.velocity.y < 10) {
            playerEntity.velocity.y += 2;
        }
        if (keysDown[KEY_A] && playerEntity.velocity.x > -10) {
            playerEntity.velocity.x -= 2;
        }
        if (keysDown[KEY_D] && playerEntity.velocity.x < 10) {
            playerEntity.velocity.x += 2;
        }
        // fire
            // shooting: {
            //     damage: damage,
            //     cooldown: 0,
            //     baseCooldown: shotCooldown
            // }
        if (playerEntity.shooting) {
            let { shooting } = playerEntity;
            shooting.cooldown = Math.max(shooting.cooldown - 1, 0);
            if (keysDown[KEY_SPACE] && shooting.cooldown === 0) {
                shooting.cooldown = shooting.baseCooldown;
                let { x, y } = playerEntity.position;
                // for (let i=0; i<2; i++) {
                let bullet = entities.makeBullet(x + 30, y, 5, 2, 30, rand(-2, 2), 'cyan', shooting.damage);
                bullet.friction = 0;
                ecs.addEntity(bullet);
                // }
            }

        }
    }
}

module.exports = {
    CollisionSystem,
    VelocitySystem, 
    HealthSystem, 
    InitBackgroundSystem, 
    ApplyInputSystem, 
    BoxRenderSystem, 
    StarSpawnerSystem,
    BlankSystem,
    OutOfBoundsSystem,
    CleanupSystem
};