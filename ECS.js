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