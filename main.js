(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const setOps = require('./setOps');

function ensure(cond, message) {
    if (!cond) throw message;
}

function props(obj) {
    let arr = [];
    for (let property in obj) {
        if (obj.hasOwnProperty(property) && obj[property] != undefined) {
            arr.push(property);
        }
    }
    return arr;
}

function has(obj, prop) {
    return obj.hasOwnProperty(prop) && obj[prop] != undefined;
}

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
        ensure(typeof entity === 'object', `Entity ${entity} is not an object`);
        // assign a guid if there is none
        if (entity.guid == undefined) entity.guid = this.guid++;
        let guid = entity.guid;
        // if there's already an entity there, throw error if different entity
        if (this.hash[guid] != undefined) {
            if (this.hash[guid] === entity) {
                console.log(`re-adding entity at guid ${guid}`);
            } else {
                throw `ECS.addEntity(entity): Existing entity at id ${guid}: ${this.hash[guid]}`;
            }
        }
        // add entity to hash
        this.hash[guid] = entity;
        // add entity to manager
        for (let component of props(entity)) {
            this.addToManager(component, guid);
        }
    }
    getFirst(components) {
        return Array.from(this.filterGuids(components))[0];
    }
    removeEntities(entities) {
        for (let entity of entities) {
            this.removeEntity(entity);
        }
    }
    removeEntity(entity) {
        let guid = entity.guid;
        // remove entity from hash
        delete this.hash[guid]
        // remove entity from manager
        for (let component of props(entity)) {
            // each manager removes the id from the list
            this.manager[component].delete(guid);
        }
    }
    addSystem(system) {
        // TODO: more to do here?
        this.systems.push(system);
        if (system.process == undefined) {
            console.log(`WARNING: system ${system} does not have a process(ecs) method defined.`);
        }
    }
    updateGuid(guid) {
        ensure(this.hash[guid] != undefined, `No entity mapped at guid ${guid}!`);
        this.updateEntity(this.hash[guid]);
    }
    updateEntity(entity) {
        ensure(typeof entity === 'object', `ECS.updateEntity(entity): Entity ${entity} is not an object`);
        ensure(entity.guid != undefined, `ECS.updateEntity(entity): Entity ${entity} has no guid!`);
        // components in manager but no longer in entity
        for (let component of props(this.manager)) {
            if (!has(entity, component)) {
                this.manager[component].delete(entity.guid);
            }
        }
        // add entity components to manager
        for (let component of props(entity)) {
            this.addToManager(component, entity.guid);
        }
    }
    addToManager(component, guid) {
        if (has(this.manager, component)) {
            // add to set if existing component type
            this.manager[component].add(guid);
        } else {
            // add set if new component type
            this.manager[component] = (guid == undefined ? new Set() : new Set([guid]));
        }
    }
    updateManager() {
        this.manager = {};
        for (let guid of props(this.hash)) {
            const entity = this.hash[guid];
            // for each component in the object, add to manager
            for (let component of props(entity)) {
                this.addToManager(component, guid);
            }
        }
    }
    filterGuids(components) {
        let { manager } = this;
        if (!has(manager, components[0])) return new Set();
        let set = manager[components[0]];
        for (let component of components.slice(1)) {
            if (has(manager, component)) {
                set = setOps.intersection(set, manager[component]);
            } else {
                return new Set();
            }
        }
        return set;
    }
    filterEntities(components) {
        return Array.from(this.filterGuids(components)).map(guid => this.hash[guid]);
    }
    names(set) {
        let arr = [];
        for (let id of set) {
            ensure(has(this.hash, id), `ECS.names(set): Guid ${id} not in hash.`);
            arr.push(this.hash[id].name);
        }
        return arr;
    }
}
if (true) {
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
    }
    ecs.addEntity(player);
    ecs.addEntity(enemy);
    ecs.addEntity(flame);
    // ecs.removeEntity(flame);
    // delete flame.position;
    console.log(ecs.names(ecs.filterGuids(['position'])));
    console.log(ecs.names(ecs.filterGuids(['heat'])));

    flame.position = undefined;
    flame.heat = 5;
    // ecs.updateEntity(flame);
    ecs.updateGuid(flame.guid);
    // ecs.updateManager();
    console.log(ecs.names(ecs.filterGuids(['position'])));
    console.log(ecs.names(ecs.filterGuids(['name','heat'])));
}

module.exports = { ECS };
},{"./setOps":4}],2:[function(require,module,exports){
function makeRect(w, h) {
    return { w, h };
}
function vec(x, y) {
    return { x, y };
}

function makeStar(x, y, vx, vy, w, h, fill) {
    return {
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
function makePlayer(x, y, w, h, fill, health, damage, shotCooldown) {
    return {
        player: true,
        render: Object.assign(makeRect(w, h), {fill}),
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
        shooting: {
            damage: damage,
            cooldown: 0,
            baseCooldown: shotCooldown
        },
        damageOnContact: 99,
        friction: 0.1,
        position: vec(x, y),
        velocity: vec(0, 0)
    };
}
function makeBullet(x, y, w, h, vx, vy, fill, damageOnContact) {
    return {
        render: Object.assign(makeRect(w, h), {fill}),
        collision: {
            box: makeRect(w, h),
            layer: FILTER_PLAYERBULLETS,
            collidesWith: FILTER_ENEMIES,
        },
        damageOnContact,
        bullet: true,
        position: vec(x, y),
        velocity: vec(vx, vy)
    }
}
function makeEnemy(x, y, w, h, fill, health, damageOnContact) {
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
        damageOnContact,
        position: vec(x, y),
        velocity: vec(0, 0)
    };
}

function makeExplosion(x, y, size, duration, fill) {
    return {
        explosion: { x, y, size, duration, fill }
    }
}

function makeGameState(xMin, yMin, xMax, yMax, width, height) {
    return {
        gameState: {
            xMin, yMin, xMax, yMax,
            windowWidth: width,
            windowHeight: height,
            fps: 30
        }
    }
}

module.exports = { makeEnemy, makePlayer, makeStar, makeGameState, makeBullet, makeExplosion };

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
    
    let sys = [
        new systems.InitBackgroundSystem(svg),
        new systems.StarSpawnerSystem(),
        new systems.EnemySpawnerSystem(),
        new systems.ApplyInputSystem(keysDown),
        new systems.OutOfBoundsSystem(),
        new systems.CollisionSystem(),
        new systems.NoHealthSystem(),
        new systems.VelocitySystem(),
        new systems.ExplosionSystem(svg),
        new systems.BoxRenderSystem(svg),
        new systems.HealthBarSystem(svg),
        new systems.CleanupSystem(),
    ]
    // let blankSystem = new systems.BlankSystem();

    let gameState = entities.makeGameState(10, 10, 800, 800, width, height);
    let enemy = entities.makeEnemy(10, 10, 30, 30, 'red', 8, 2);
    // let star = entities.makeStar(100, 100, 4, 2, 5, 5, 'purple');
    ecs.addEntities(gameState, entities.makePlayer(100, 100, 50, 30, 'yellow', 10, 2, 20));
    function update() {
        ecs.updateManager();
        for (let system of sys) {
            system.process(ecs);
        }
        // requestAnimationFrame(update);
    }
    // update();
    setInterval(update, 1000/60);

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

function props(obj) {
    let arr = [];
    for (let property in obj) {
        if (obj.hasOwnProperty(property) && obj[property] != undefined) {
            arr.push(property);
        }
    }
    return arr;
}

function HealthSystem(debug=false) {
    this.filter = ['health'];
    this.debug = debug;
    this.process = function(ecs) {
        let guids = ecs.filterGuids(this.filter);
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
        let guids = ecs.filterGuids(this.filter);
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
        let guids = ecs.filterGuids(this.filter);
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
        // HACK: ugly naming, perhaps more granularity is needed
        let gameState = ecs.hash[ecs.getFirst(['gameState'])].gameState;
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
function EnemySpawnerSystem(debug=false) {
    this.debug = debug;
    this.cooldown = 20;
    this.process = function(ecs) {
        // HACK: ugly naming, perhaps more granularity is needed
        let gameState = ecs.hash[ecs.getFirst(['gameState'])].gameState;
        let { xMin, yMin, xMax, yMax } = gameState;
        this.cooldown = Math.max(this.cooldown - 1, 0);
        if (this.cooldown === 0) {
            // new cooldown
            this.cooldown = ~~rand(10, 20);
            let enemy = entities.makeEnemy(xMax, rand(yMin, yMax), 40, 30, 'grey', 10, 4);
            enemy.velocity = {x:-3, y:1};
            ecs.addEntity(enemy);
        }
        this.debug && console.log(`bounds:`, xMin, yMin, xMax, yMax);
    }
}

function OutOfBoundsSystem(debug=false) {
    this.filter = ['position'];
    this.debug = debug;
    this.process = function(ecs) {
        let gameState = ecs.hash[ecs.getFirst(['gameState'])].gameState;
        let { xMin, yMin, xMax, yMax } = gameState;
        let guids = ecs.filterGuids(this.filter);
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
        let guids = ecs.filterGuids(this.filter);
        for (let guid of guids) {
            let entity = ecs.hash[guid];
            if (entity.render) {
                // entity.render.svg.remove();
                for (let prop of props(entity.render)) {
                    if (prop.slice(0, 3) === 'svg') {
                        entity.render[prop].remove();
                    }
                }
            }
            ecs.removeEntity(entity);
        }
    }
}

function svgRect(svg, w, h, fill='blue') {
    return svg.append(`rect`)
        .attrs({'x':0, 'y':0, 'width':w, 'height':h, 'fill':fill})
}
const getTransform = (x, y, ang=0, scale=1) => `translate(${x} ${y})` + `rotate(${ang})` + `scale(${scale})`;

function BoxRenderSystem(svg, debug=false) {

    this.filter = ['render', 'position'];
    this.debug = debug;
    this.process = function(ecs) {
        let entities = ecs.filterEntities(this.filter);
        for (let entity of entities) {
            let { w, h, fill } = entity.render;
            let { x, y } = entity.position;
            if (!entity.render.svgBox) {
                // first time init
                entity.render.svgBox = svgRect(svg, w, h, fill);
            }
            // update render
            entity.render.svgBox.attr('transform', getTransform(x - w/2, y - h/2));
            this.debug && console.log(``);
        }
    }
}


function CollisionSystem(debug=false) {
    function rangeIntersect(min0, max0, min1, max1) {
        return Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.max(min1, max1);
    };
    function boxIntersect(x0, y0, w0, h0, x1, y1, w1, h1) {
        return rangeIntersect(x0, x0 + w0, x1, x1 + w1) && rangeIntersect(y0, y0 + h0, y1, y1 + h1);
    }
    this.filter = ['collision', 'position'];
    this.debug = debug;
    this.process = function(ecs) {
        let entities = ecs.filterEntities(this.filter);
        for (let i=0; i<entities.length; i++) {
            let entity = entities[i];
            let { position: { x: x0, y: y0}, collision: { box: { w: w0, h: h0 }} } = entity;
            let { layer, collidesWith } = entity.collision;
            for (let j=0; j<entities.length; j++) {
                if (i != j) {
                    let otherEntity = entities[j];
                    let { position: { x: x1, y: y1}, collision: { box: { w: w1, h: h1 }} } = otherEntity;
                    let { layer: otherLayer, collidesWith: otherCollideswith } = otherEntity.collision;
                    if (boxIntersect(x0, y0, w0, h0, x1, y1, w1, h1)) {
                        if (collidesWith & otherLayer) {
                            if (entity.damageOnContact && otherEntity.health) {
                                otherEntity.health.current -= entity.damageOnContact;
                            }
                            if (entity.bullet) entity.dead = true;
                            // ecs.addEntity(entities.makeExplosion(x0, y0, 30, 300, 'cyan'));
                            ecs.addEntity({
                                explosion: { x:x0, y:y0, size:30, duration:300, fill:"cyan" }
                            });
                        }
                    }
                }
            }
        }
    }

}

function InitBackgroundSystem(svg, debug=false) {
    this.filter = ['gameState'];
    this.debug = debug;
    this.svg = svg;
    this.process = function(ecs) {
        let guids = ecs.filterGuids(this.filter);
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


function HealthBarSystem(svg, debug=false) {
    this.filter = ['health', 'render'];
    this.debug = debug;
    this.svg = svg;
    let healthBarBaseLength = 40;
    this.process = function(ecs) {
        let entities = ecs.filterEntities(this.filter);
        for (let entity of entities) {
            let { render, health: { base: baseHealth, current: currentHealth } } = entity;
            let healthBarLength = healthBarBaseLength * currentHealth / baseHealth;
            if (!render.svgHealthBar) {
                // draw health bar
                render.svgHealthBar = svgRect(svg, healthBarLength, 5, 'green');
            }
            // update health bar
            let { x, y } = entity.position;
            let w = 20, h = 20;
            if (entity.collision && entity.collision.box) {
                w = entity.collision.box.w;
                h = entity.collision.box.h;
            }
            render.svgHealthBar.attr('transform', getTransform(x - healthBarLength/2, y - h));
            render.svgHealthBar.attr('width', healthBarLength);
        }
    }
}

function NoHealthSystem(debug=false) {
    this.filter = ['health'];
    this.debug = debug;
    this.process = function(ecs) {
        let entities = ecs.filterEntities(this.filter);
        for (let entity of entities) {
            let { health: { base: baseHealth, current: currentHealth }, position: {x, y} } = entity;
            if (currentHealth <= 0) {
                entity.dead = true;
                ecs.addEntity({
                    explosion: { x, y, size:50, duration:500, fill:"orange" }
                });
            }
        }
    }
}

function ExplosionSystem(svg, debug=false) {
    this.filter = ['explosion'];
    this.debug = debug;
    this.svg = svg;

    function boom(svg, x, y, size, duration, fill='orange') {
        svg.append('ellipse')
            .attrs({'cx': x, 'cy': y, 'rx': 0.1 * size, 'ry': 0.05 * size, 'fill': fill})
            .transition()
                .duration(duration)
                .attrs({'rx': size, 'ry': size})
                .style('opacity', 0)
                .remove();
    }

    this.process = function(ecs) {
        let entities = ecs.filterEntities(this.filter);
        for (let entity of entities) {
            let { x, y, size, duration, fill } = entity.explosion;
            boom(svg, x, y, size, duration, fill);
            entity.dead = true;
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
        let playerEntity = ecs.hash[ecs.getFirst(['player'])];
        // thrust
        if (keysDown[KEY_W] && playerEntity.velocity.y > -10) {
            playerEntity.velocity.y -= 1;
        }
        if (keysDown[KEY_S] && playerEntity.velocity.y < 10) {
            playerEntity.velocity.y += 1;
        }
        if (keysDown[KEY_A] && playerEntity.velocity.x > -10) {
            playerEntity.velocity.x -= 1;
        }
        if (keysDown[KEY_D] && playerEntity.velocity.x < 10) {
            playerEntity.velocity.x += 1;
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
                for (let i=0; i<8; i++) {
                    let bullet = entities.makeBullet(x + 30, y, 10, 4, rand(10, 20), rand(-2, 2), 'cyan', shooting.damage);
                    bullet.friction = 0;
                    ecs.addEntity(bullet);
                }
            }

        }
    }
}

module.exports = {
    CollisionSystem,
    VelocitySystem, 
    HealthSystem, 
    NoHealthSystem,
    ExplosionSystem,
    InitBackgroundSystem, 
    ApplyInputSystem, 
    BoxRenderSystem, 
    StarSpawnerSystem,
    HealthBarSystem,
    EnemySpawnerSystem,
    BlankSystem,
    OutOfBoundsSystem,
    CleanupSystem
};
},{"./entities":2}]},{},[3]);
