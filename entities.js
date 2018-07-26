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
        friction: 0.1,
        position: vec(x, y),
        velocity: vec(0, 0)
    };
}
function makeBullet(x, y, w, h, vx, vy, fill, damage) {
    return {
        render: Object.assign(makeRect(w, h), {fill}),
        collision: {
            box: makeRect(w, h),
            layer: FILTER_PLAYERBULLETS,
            collidesWith: FILTER_ENEMIES,
        },
        damage,
        position: vec(x, y),
        velocity: vec(vx, vy)
    }
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

module.exports = { makeEnemy, makePlayer, makeStar, makeGameState, makeBullet };
