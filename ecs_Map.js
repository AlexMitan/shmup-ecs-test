const setOps = require('./setOps');
class ECS {
    constructor() {
        // { 0:entity, 1:undefined, 2:entity }
        this.hash = new Map();
        this.idCtr = 1;
        // { "sprite": [0, 1], "health": [0, 2] }
        this.manager = new Map();;
    }
    addEntities(...entities) {
        for (let entity of entities) {
            this.addEntity(entity);
        }
    }
    addEntity(entity) {
        // assign a id if there is none
        if (entity.id === undefined) entity.id = this.idCtr++;
        let id = entity.id;
        let { hash, manager } = this; 
        // if there's already an entity there, throw error
        if (hash.has(id))
            throw `Existing entity at id ${id}: ${hash[id]}`;
        // add entity to hash
        hash.set(id, entity);
        // add entity to manager
        for (let component in entity) {
            if (entity.hasOwnProperty(component)) {
                // for each component in the object
                if (!manager.has(component)) {
                    manager.set(component, new Set([id]));
                } else {
                    manager.get(component).add(id);
                }
            }
        }
    }
    removeEntities(...entities) {
        for (let entity of entities) {
            this.removeEntity(entity);
        }
    }
    removeEntity(entity) {
        let id = entity.id;
        // remove entity from hash
        this.hash.delete(id);
        // remove entity from manager
        for (let component in entity) {
            if (entity.hasOwnProperty(component)) {
                // each manager removes the id from the list
                this.manager.get(component).delete(id);
                // TODO: collapse manager?
            }
        }
    }
    filter(...components) {
        let set = this.manager.get(components[0]);
        for (let component of components) {
            set = setOps.intersection(this.manager[component]);
        }
        return set;
        // return setOps.intersection(...components.map(comp => this.manager[comp]));
    }
    names(set) {
        let arr = [];
        for (let id of set) {
            arr.push(this.hash.get(id) && this.hash.get(id).name);
        }
        return arr;
    }
}
let ecs = new ECS();
function makeCounter() {
    var i=1;
    return () => i++;
}
let idCounter = makeCounter();

let player = {
    name: 'player',
    id: idCounter(),
    player: true,
    sprite: './player.png',
    health: 10
}
let enemy = {
    name: 'enemy',
    id: idCounter(),
    position: {x: 20, y: 20},
    velocity: {vx: 4, vy: -3},
    sprite: './enemy.png',
    health: 5
}

let flame = {
    name: 'flame',
    id: idCounter(),
    sprite: './fire.png'
}
ecs.addEntity(player);
ecs.addEntity(enemy);
ecs.addEntity(flame);

console.log(ecs);
console.log(ecs.hash.get(1));


console.log(ecs.names(ecs.filter('sprite', 'health')));
console.log(ecs.filter('sprite', 'health'));
ecs.removeEntity(enemy);
console.log(ecs.names(ecs.filter('sprite', 'health')));