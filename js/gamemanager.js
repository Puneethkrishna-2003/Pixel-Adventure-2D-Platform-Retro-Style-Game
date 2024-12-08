class GameManager {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.isLoading = true;
    this.loadingProgress = 0;
    this.resourcesLoaded = false;

    // Centralized resource tracking
    this.resources = {
      images: [],
      sounds: [],
    };
  }

  preloadResources() {
    return new Promise((resolve, reject) => {
      const imagesToLoad = [
        // Collect all image paths from animations, levels, etc.
        ...Object.values(this.player.animations).flatMap((anim) =>
          anim.framePaths.map(
            (path) => `../assets/images/characters/player/${path}`
          )
        ),
        // Add level map images
        ...Object.values(LEVEL_DATA).map((level) => level.mapPath),
        // Add other image paths as needed
      ];

      const loadImage = (src) => {
        return new Promise((resolveImage, rejectImage) => {
          const img = new Image();
          img.onload = () => resolveImage(img);
          img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            rejectImage(new Error(`Image load failed: ${src}`));
          };
          img.src = src;
          this.resources.images.push(img);
        });
      };

      // Preload all images
      Promise.all(imagesToLoad.map(loadImage))
        .then(() => {
          this.resourcesLoaded = true;
          this.isLoading = false;
          resolve();
        })
        .catch(reject);
    });
  }

  initializeGame() {
    // Ensure canvas is set up
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Create global context for other classes
    window.canvas = this.canvas;
    window.ctx = this.ctx;

    // Initialize core game components
    this.player = new Player({ x: 0, y: 0 });
    this.levelManager = new LevelManager();
    this.levelManager.init(this.player);

    // Set up game loop with loading protection
    this.startGameLoop();
  }

  startGameLoop() {
    const gameLoop = () => {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Only update game if resources are loaded
      if (this.resourcesLoaded) {
        this.levelManager.update();
        this.player.drawHUD();
      } else {
        // Show loading screen
        this.drawLoadingScreen();
      }

      // Continue game loop
      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }

  drawLoadingScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Loading...", this.canvas.width / 2, this.canvas.height / 2);
  }

  // Main initialization method
  async start() {
    try {
      // Show initial loading screen
      this.drawLoadingScreen();

      // Preload all resources
      await this.preloadResources();

      // Initialize game components
      this.initializeGame();
    } catch (error) {
      console.error("Game initialization failed:", error);
      this.showErrorScreen(error);
    }
  }

  showErrorScreen(error) {
    const ctx = this.ctx;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Game Load Error",
      this.canvas.width / 2,
      this.canvas.height / 2 - 30
    );
    ctx.fillText(
      error.message,
      this.canvas.width / 2,
      this.canvas.height / 2 + 30
    );
  }
}

// Initialization script
document.addEventListener("DOMContentLoaded", () => {
  const gameManager = new GameManager();
  gameManager.start();
});
