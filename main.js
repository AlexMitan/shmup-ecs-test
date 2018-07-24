(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const setOps = require('./setOps');
class ECS {
    constructor() {
        // { 0:entity, 1:undefined, 2:entity }
        this.hash = {};
        this.systems = [];
        this.guid = 1;
        // { "sprite": [0, 1], "health": [0, 2] }
        this.manager = {};
    }
    addEntities(...entities) {
        for (let entity of entities) {
            this.addEntity(entity);
        }
    }
    addEntity(entity) {
        // assign a guid if there is none
        if (entity.guid === undefined) entity.guid = this.guid++;
        let guid = entity.guid;
        // if there's already an entity there, throw error
        if (this.hash[guid] !== undefined)
        throw `Existing entity at id ${guid}: ${this.hash[guid]}`;
        // add entity to hash
        this.hash[guid] = entity;
    }
    getFirst(...components) {
        return Array.from(this.filter(...components))[0];
    }
    removeEntities(...entities) {
        for (let entity of entities) {
            this.removeEntity(entity);
        }
    }
    removeEntity(entity) {
        let guid = entity.guid;
        // remove entity from hash
        delete this.hash[guid]
        // remove entity from manager
        for (let component in entity) {
            if (entity.hasOwnProperty(component)) {
                // each manager removes the id from the list
                this.manager[component].delete(guid);
                // TODO: collapse manager?
            }
        }
    }
    addSystem(system) {
        // TODO: more to do here?
        this.systems.push(system);
        if (system.process === undefined) {
            console.log(`WARNING: system ${system} does not have a process(ecs) method defined.`);
        }
    }
    updateManager() {
        this.manager = {};
        for (const guid in this.hash) {
            if (this.hash.hasOwnProperty(guid)) {
                const entity = this.hash[guid];
                // add entity to manager
                for (let component in entity) {
                    if (entity.hasOwnProperty(component)) {
                        // for each component in the object
                        if (this.manager[component] === undefined) {
                            this.manager[component] = new Set([guid]);
                        } else {
                            this.manager[component].add(guid);
                        }
                    }
                }
            }
        }
    }
    filter(...components) {
        let set = this.manager[components[0]];
        for (let component of components) {
            set = setOps.intersection(this.manager[component]);
        }
        return set;
        // return setOps.intersection(...components.map(comp => this.manager[comp]));
    }
    names(set) {
        let arr = [];
        for (let id of set) {
            arr.push(this.hash[id] && this.hash[id].name);
        }
        return arr;
    }
}
if (false) {
    let ecs = new ECS();
    let player = {
        name: 'player',
        player: true,
        sprite: './player.png',
        health: {
            base: 20,
            regen: 1,
            current: 18
        }
    }
    let enemy = {
        name: 'enemy',
        position: {x: 20, y: 20},
        velocity: {x: 4, y: -2},
        sprite: './enemy.png',
        health: {
            base: 10,
            regen: 5,
            current: 7
        }
    }
    
    let flame = {
        name: 'flame',
        position: {x: 4, y: 4},
        velocity: {x: 0, y: -3},
        friction: 0.5,
        sprite: './fire.png',
        health: {
            whatever: 5
        }
    }
    ecs.addEntity(player);
    ecs.addEntity(enemy);
    ecs.addEntity(flame);
    
    console.log(ecs.names(ecs.filter('position', 'velocity')));
}

module.exports = { ECS };
},{"./setOps":4}],2:[function(require,module,exports){
function makeRect(w, h) {
    return { w, h };
}
function vec(x, y, vx, vy) {
    return { x, y };
}

function makeStar(x, y, vx, vy, w, h, fill) {
    return {
        // render: Object.assign({}, makeRect(w, h), {fill}),
        render: {
            w: w, h: h, fill: fill
        },
        position: vec(x, y),
        velocity: vec(vx, vy)
    }
}
const FILTER_PLAYER        = 0b00001;
const FILTER_ENEMIES       = 0b00010;
const FILTER_PLAYERBULLETS = 0b00100;
function makePlayer(x, y, w, h, fill, health, damage, fireRate) {
    return {
        render: Object.assign({}, makeRect(w, h), {fill}),
        collision: {
            box: makeRect(w, h),
            layer: FILTER_PLAYER,
            collidesWith: FILTER_ENEMIES,
        },
        health: {
            base: health, 
            current: health, 
            regen: 0
        },
        input: {
            x: 0,
            y: 0,
            fire: 0
        },
        position: vec(x, y),
        velocity: vec(0, 0)
    };
}
function makeEnemy(x, y, w, h, fill, health, damage) {
    return {
        render: Object.assign({}, makeRect(w, h), { fill }),
        collision: {
            box: makeRect(w, h),
            layer: FILTER_ENEMIES,
            collidesWith: FILTER_PLAYER | FILTER_PLAYERBULLETS,
        },
        health: {
            base: health, 
            current: health, 
            regen: 0
        },
        position: vec(x, y),
        velocity: vec(0, 0)
    };
}

function makeGameState(xMin, yMin, xMax, yMax, width, height) {
    return {
        gameState: {
            xMin, yMin, xMax, yMax,
            windowWidth: width,
            windowHeight: height
        }
    }
}
function makeStarSpawner() {
    return {
        starSpawner: {
            starSpawner: true
        }
    }
}
// console.log(makeRect(10, 11, 20, 30));
console.log(makeStar(10, 10, 5, 5, 'white'));

module.exports = { makeEnemy, makePlayer, makeStar, makeGameState };

},{}],3:[function(require,module,exports){
window.onload = () => {
    let fps = 30,
        tick = 1;
    let width = window.innerWidth - 40,
        height = window.innerHeight - 40;
    // input
    let keysDown = {};
    document.body.addEventListener('keydown', function(e) {
        keysDown[e.which] = true;
        // console.log(e.which);
    });
    document.body.addEventListener('keyup', function(e) {
        keysDown[e.which] = false;
    });
    // add an svg
    let svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    let systems = require('./systems');
    let entities = require('./entities');
    let { ECS } = require('./ECS');
    
    let ecs = new ECS();
    
    
    let velocitySystem = new systems.VelocitySystem();
    let initBackgroundSystem = new systems.InitBackgroundSystem(svg);
    let boxRenderSystem = new systems.BoxRenderSystem(svg);
    let starSpawnerSystem = new systems.StarSpawnerSystem();
    // let blankSystem = new systems.BlankSystem();

    let gameState = entities.makeGameState(10, 10, 800, 800, width, height);
    // let enemy = entities.makeEnemy(10, 10, 30, 30, 'red', 8, 2);
    // let star = entities.makeStar(100, 100, 4, 2, 5, 5, 'purple');
    ecs.addEntities(gameState);
    ecs.addEntity({
        starSpawner: {
            cooldown: 0,
            baseCooldown: 20
        }
    })
    setInterval(() => {
        ecs.updateManager();
        starSpawnerSystem.process(ecs);
        velocitySystem.process(ecs);
        initBackgroundSystem.process(ecs);
        boxRenderSystem.process(ecs);
    }, 1000/30);
}
},{"./ECS":1,"./entities":2,"./systems":5}],4:[function(require,module,exports){
function isSuperset(set, subset) {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}

function union(setA, ...sets) {
    let _union = new Set(setA);
    for (let setB of sets) {
        for (let elem of setB) {
            _union.add(elem);
        }
    }
    return _union;
}

function intersection(setA, ...sets) {
    let _intersection = new Set(setA);
    for (let setB of sets) {
        for (let elem of setB) {
            if (!_intersection.has(elem)) {
                _intersection.delete(elem);
            }
        }
    }
    return _intersection;
}

function difference(setA, ...sets) {
    let _difference = new Set(setA);
    for (let setB of sets) {
        for (let elem of setB) {
            _difference.delete(elem);
        }
    }
    return _difference;
}

module.exports = { isSuperset, union, intersection, difference };
},{}],5:[function(require,module,exports){
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
            } else {
                console.log(`Incorrect specification on ${JSON.stringify(entity)} for component health`);
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
            if (entity.friction) {
                entity.velocity.x *= 1 - entity.friction;
                entity.velocity.y *= 1 - entity.friction;
            }
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
    this.filter = [];
    this.debug = debug;
    this.process = function(ecs) {
        // HACK: seriously?
        // let gameStateGuid = Array.from(ecs.filter('gameState'))[0];
        // HACK: ugly naming, perhaps more granularity is needed
        let gameState = ecs.hash[ecs.getFirst('gameState')].gameState;
        let starSpawner = ecs.hash[ecs.getFirst('starSpawner')].starSpawner;
        this.debug && console.log(`found gameState: ${gameState}`);
        this.debug && console.log(`found starSpawner: ${starSpawner}`);
        let { xMin, yMin, xMax, yMax } = gameState;
        starSpawner.cooldown = Math.max(starSpawner.cooldown - 1, 0);
        if (starSpawner.cooldown === 0) {
            starSpawner.baseCooldown = ~~rand(2, 10);
            starSpawner.cooldown = starSpawner.baseCooldown;
            let closeness = rand(0.1, 1);
            let star = entities.makeStar(xMax, rand(yMin, yMax), -closeness*30, 0, closeness*5, closeness*5, 'white');
            ecs.addEntity(star);
        }
        this.debug && console.log(`bounds:`, xMin, yMin, xMax, yMax);
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
}

module.exports = {
    CollisionSystem,
    VelocitySystem, 
    HealthSystem, 
    InitBackgroundSystem, 
    ApplyInputSystem, 
    BoxRenderSystem, 
    StarSpawnerSystem,
    BlankSystem
};
},{"./entities":2}]},{},[3]);
