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
