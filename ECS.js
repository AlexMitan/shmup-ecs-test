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
    getFirst(...components) {
        return Array.from(this.filterGuids(...components))[0];
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
    filterGuids(...components) {
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
    filterEntities(...components) {
        return Array.from(this.filterGuids(...components)).map(guid => this.hash[guid]);
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
    console.log(ecs.names(ecs.filterGuids('position')));
    console.log(ecs.names(ecs.filterGuids('heat')));

    flame.position = undefined;
    flame.heat = 5;
    // ecs.updateEntity(flame);
    ecs.updateGuid(flame.guid);
    // ecs.updateManager();
    console.log(ecs.names(ecs.filterGuids('position')));
    console.log(ecs.names(ecs.filterGuids('heat')));
    console.log(ecs.names(ecs.filterGuids('heat')));
}

module.exports = { ECS };