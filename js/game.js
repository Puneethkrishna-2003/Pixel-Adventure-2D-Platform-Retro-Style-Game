const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthPickupManager = new HealthPickupManager();

function updateCanvasSize(level) {
  canvas.width = level.mapLayout.width;
  canvas.height = level.mapLayout.height;
  console.log(`Canvas updated: Width=${canvas.width}, Height=${canvas.height}`);
}

  // canvas.width = 1200;
  // canvas.height = 650;

const levelManager = new LevelManager();
const player = new Player({ x: 100, y: 100 });
// const player2 = new Player({ x: 150, y: 100 });

const initialLevel = LEVEL_DATA.level1; 
updateCanvasSize(initialLevel); 
levelManager.init(player);

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  levelManager.update();

  ctx.translate(
    -levelManager.currentLevel.camera.x,
    -levelManager.currentLevel.camera.y
  );

  levelManager.collisionBlocks.forEach((block) => block.update());

  healthPickupManager.update(player);
  healthPickupManager.draw(ctx);

  if (!player.isDead) {
    player.update();
    player.drawHUD();
  } else if (player.lives > 0) {
    setTimeout(() => {
      levelManager.loadCurrentLevel();
    }, 2000);
  } else {
    player.gameOver();
    return;
  }

  levelManager.enemyManager.draw(ctx);

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
