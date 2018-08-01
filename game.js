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