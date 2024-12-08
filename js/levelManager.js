class LevelManager {
  constructor() {
    this.levels = Object.keys(LEVEL_DATA);
    this.currentLevelIndex = 0;
    this.currentLevel = null;
    this.player = null;
    this.enemyManager = null;
    this.collisionBlocks = [];
  }

  init(player) {
    this.player = player;
    this.enemyManager = new EnemyManager();
    this.loadCurrentLevel();
  }

  generateCollisionBlocks(collisionMap) {
    let floorCollections = [];

    // Convert collision values to binary (1 for collision, 0 for no collision)
    for (let i = 0; i < collisionMap.length; i++) {
      floorCollections.push(collisionMap[i] > 1 ? 1 : 0);
    }

    // Convert to 2D array with width of 200
    let floorCollection2D = [];
    for (let i = 0; i < floorCollections.length; i += 200) {
      floorCollection2D.push(floorCollections.slice(i, i + 200));
    }

    // Generate collision blocks
    let blocks = [];
    floorCollection2D.forEach((row, y) => {
      row.forEach((symbol, x) => {
        if (symbol === 1) {
          blocks.push(
            new CollisionBlock({
              position: {
                x: x * 16,
                y: y * 16,
              },
            })
          );
        }
      });
    });

    return blocks;
  }

  loadCurrentLevel() {
    const levelKey = this.levels[this.currentLevelIndex];
    const levelData = LEVEL_DATA[levelKey];

    this.currentLevel = new Level(levelData.mapPath);

    // Set player position to level's start position
    this.player.position = { ...levelData.startPosition };
    this.player.levelName = levelData.name;

    this.collisionBlocks = this.generateCollisionBlocks(levelData.collisionMap);

    this.enemyManager.clearEnemies();
    levelData.enemies.forEach((enemyConfig) => {
      enemyConfig.positions.forEach((position) => {
        this.enemyManager.addEnemy(enemyConfig.type, position);
      });
    });

    healthPickupManager.spawnLevelPickups(levelData);
  }

  nextLevel() {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.loadCurrentLevel();
      return true;
    }
    return false;
  }

  update() {
    if (this.currentLevel && this.player) {
      // Update level and camera
      this.currentLevel.update(this.player);

      // Update collision blocks
      this.collisionBlocks.forEach((block) => block.update());

      // Update enemies
      this.enemyManager.update(this.player, this.collisionBlocks);

      // Check level completion
      if (this.enemyManager.areAllEnemiesDead()) {
        this.nextLevel();
      }
    }
  }
}