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