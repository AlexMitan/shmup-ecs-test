const setOps = require('./setOps');

function ensure(cond, message) {
    if (!cond) throw message;
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
        if (entity.guid === undefined) entity.guid = this.guid++;
        let guid = entity.guid;
        // if there's already an entity there, throw error
        if (this.hash[guid] !== undefined)
        throw `Existing entity at id ${guid}: ${this.hash[guid]}`;
        // add entity to hash
        this.hash[guid] = entity;
        // add entity to manager
        for (let component in entity) {
            if (entity.hasOwnProperty(component)) {
                // for each component in the object, add it to manager
                if (this.manager[component] === undefined) {
                    this.manager[component] = new Set([guid]);
                } else {
                    this.manager[component].add(guid);
                }
            }
        }
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
    updateGuid(guid) {
        ensure(this.hash[guid] !== undefined, `No entity mapped at guid ${guid}!`);
        this.updateEntity(this.hash[guid]);
    }
    updateEntity(entity) {
        ensure(typeof entity === 'object', `Entity ${entity} is not an object`);
        for (const component in this.manager) {
            if (this.manager.hasOwnProperty(component)) {
                if (entity[component] === undefined) {
                    this.manager[component].delete(entity.guid);
                } else {
                    this.manager[component].add(entity.guid);
                }
            }
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
                            // add set if undefined
                            this.manager[component] = new Set([guid]);
                        } else {
                            // add to set if existing component type
                            this.manager[component].add(guid);
                        }
                    }
                }
            }
        }
    }
    filter(...components) {
        let { manager } = this;
        let set = manager[components[0]] === undefined ? new Set() : manager[components[0]];
        for (let component of components) {
            if (manager[component] !== undefined) {
                set = setOps.intersection(set, manager[component]);
            }
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
    console.log(ecs.names(ecs.filter('position', 'velocity')));
    ecs.addEntity(enemy);
    console.log(ecs.names(ecs.filter('position', 'velocity')));
    ecs.addEntity(flame);
    console.log(ecs.names(ecs.filter('position', 'velocity')));
    // ecs.removeEntity(flame);
    // delete flame.position;
    flame.position = undefined;
    ecs.updateGuid(flame.guid);
    console.log(ecs.names(ecs.filter('position', 'velocity')));
    // ecs.updateManager();
}

module.exports = { ECS };