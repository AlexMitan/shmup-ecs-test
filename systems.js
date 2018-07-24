
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

function StarSpawnerSystem(debug=false) {
    this.filter = [];
    this.debug = debug;
    console.log('created star spawner');
    this.process = function(ecs) {
        console.log('running star spawner');
        
        // HACK: seriously?
        // let gameStateGuid = Array.from(ecs.filter('gameState'))[0];
        let gameStateGuid = ecs.getFirst('gameState');
        let gameState = ecs.hash[gameStateGuid];
        this.debug && console.log(`found gameState: ${gameState}`);
        // HACK: ugly naming, perhaps more granularity is needed
        let { xMin, yMin, xMax, yMax } = gameState.gameState;
        this.debug && console.log(`bounds:`, xMin, yMin, xMax, yMax);
        // let guids = ecs.filter(...this.filter);
        // this.debug && console.log(`running blank on ${ecs.names(guids)}`);
        // for (let guid of guids) {
        //     let entity = ecs.hash[guid];
        //     this.debug && console.log(``);
        // }
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