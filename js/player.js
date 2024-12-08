class Player {
  constructor(position) {
    this.position = position;
    this.height = 80;
    this.width = 44;
    this.speed = 3;
    this.velocityY = 0;
    this.gravity = 0.3;
    this.jumpStrength = -8;
    this.onGround = false;
    this.facingRight = true;

    // Animation states with priority
    this.currentState = "idle";
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 100;

    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.healthBarWidth = this.width;

    // HUD properties
    this.lives = 3;

    this.attackBox = {
      width: 60,
      height: 50,
      offsetX: 30,
      offsetY: 15,
    };
    this.attackDamage = 25;
    this.attackCooldown = 500; // ms
    this.lastAttackTime = 0;
    this.isDeathProcessActive = false;

    // State flags with priority handling
    this.states = {
      defending: false,
      attacking: false,
      jumping: false,
      running: false,
      idle: true,
    };

    this.hurtSound = new Audio("assets/audio/sound_effects/player/hurt.mp3");
    this.deathSound = new Audio("assets/audio/sound_effects/player/hurt.mp3");

    

    // Animation definitions
    this.animations = {
      idle: {
        frames: [],
        frameCount: 6,
        framePaths: [
          "idle (1).png",
          "idle (2).png",
          "idle (3).png",
          "idle (4).png",
          "idle (5).png",
          "idle (6).png",
        ],
        loop: true,
      },
      run: {
        frames: [],
        frameCount: 11,
        framePaths: [
          "run (1).png",
          "run (2).png",
          "run (3).png",
          "run (4).png",
          "run (5).png",
          "run (6).png",
          "run (7).png",
          "run (8).png",
          "run (9).png",
          "run (10).png",
          "run (11).png",
        ],
        loop: true,
      },
      jump: {
        frames: [],
        frameCount: 14,
        framePaths: [
          "jump (1).png",
          "jump (2).png",
          "jump (3).png",
          "jump (4).png",
          "jump (5).png",
          "jump (6).png",
          "jump (7).png",
          "jump (8).png",
          "jump (9).png",
          "jump (10).png",
          "jump (11).png",
          "jump (12).png",
          "jump (13).png",
          "jump (14).png",
        ],
        loop: false,
      },
      attack: {
        frames: [],
        frameCount: 7,
        framePaths: [
          "attack (1).png",
          "attack (2).png",
          "attack (3).png",
          "attack (4).png",
          "attack (5).png",
          "attack (6).png",
          "attack (7).png",
        ],
        loop: false,
      },
      defend: {
        frames: [],
        frameCount: 3,
        framePaths: [
          "defend (1).png",
          "defend (2).png",
          "defend (3).png",
         ],
        loop: false,
      },
      dead: {
        frames: [],
        frameCount: 6,
        framePaths: [
          "death (1).png",
          "death (2).png",
          "death (3).png",
          "death (4).png",
          "death (5).png",
          "death (6).png",
        ],
        loop: false,
      },
    };

    this.loadAnimations();
  }

  loadAnimations() {
    const basePath = "../assets/images/characters/player/";
    Object.keys(this.animations).forEach((state) => {
      this.animations[state].frames = this.animations[state].framePaths.map(
        (path) => {
          const img = new Image();
          img.src = basePath + path;
          img.onerror = () => console.error(`Failed to load: ${path}`);
          return img;
        }
      );
    });
  }

  determineState() {
    // Check states in order of priority
    if (this.states.defending) return "defend";
    if (this.states.attacking) return "attack";
    if (this.states.jumping) return "jump";
    if (this.states.running) return "run";
    return "idle";
  }

  setState(newState) {
    Object.keys(this.states).forEach((state) => {
      this.states[state] = false;
    });

    // Set the new state
    switch (newState) {
      case "defend":
        this.states.defending = true;
        break;
      case "attack":
        this.states.attacking = true;
        break;
      case "jump":
        this.states.jumping = true;
        break;
      case "run":
        this.states.running = true;
        break;
      default:
        this.states.idle = true;
    }

    // Update current state and reset animation frame
    const prevState = this.currentState;
    this.currentState = newState;
    if (prevState !== newState) {
      this.frameIndex = 0;
      this.frameTimer = Date.now();
    }

    if (newState === "attack") {
      const currentTime = Date.now();
      if (currentTime - this.lastAttackTime < this.attackCooldown) {
        return;
      }
      this.lastAttackTime = currentTime;
    }
  }

  takeDamage(amount) {
    if (!this.states.defending && !this.isDead && !this.isInvulnerable) {
      this.health -= amount;
      this.isInvulnerable = true;
      this.hurtSound.play();

      setTimeout(() => {
        this.isInvulnerable = false;
      }, 1000);

      // Directly trigger death if health reaches 0
      if (this.health <= 0) {
        this.die();
      }
    }
  }

  update() {
    // Apply gravity
    if (!this.onGround) {
      this.velocityY += this.gravity;
      this.position.y += this.velocityY;
    }

    if (!this.states.attacking) {
      if (keys.ArrowDown) {
        this.setState("defend");
      } else if (this.states.defending) {
        this.setState("idle");
      }

      // Movement
      if (!this.states.defending) {
        if (keys.ArrowRight) {
          this.position.x += this.speed;
          this.facingRight = true;
          if (this.onGround && !this.states.jumping) {
            this.setState("run");
          }
        } else if (keys.ArrowLeft) {
          this.position.x -= this.speed;
          this.facingRight = false;
          if (this.onGround && !this.states.jumping) {
            this.setState("run");
          }
        } else if (this.states.running && this.onGround) {
          this.setState("idle");
        }
      }

      // Jump
      if (keys.ArrowUp && this.onGround && !this.states.defending) {
        this.velocityY = this.jumpStrength;
        this.onGround = false;
        this.setState("jump");
      }

      // Attack
      if (keys[" "] && !this.states.defending && !this.states.attacking) {
        this.setState("attack");
        setTimeout(() => {
          if (this.states.attacking) {
            this.setState("idle");
          }
        }, 500);
      }
    }
    this.checkAttackCollisions();
    this.updateAnimation();
    this.checkCollisions();
    this.draw();
  }

  drawHUD() {
    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = "white";
    ctx.font = "15px Arial";

    ctx.fillText(this.levelName, 20, 25);

    const lifeSize = 15;
    const lifeSpacing = 20;
    for (let i = 0; i < this.lives; i++) {
      ctx.beginPath();
      ctx.arc(100 + i * lifeSpacing, 20, lifeSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  draw() {
    const animation = this.animations[this.currentState];
    if (!animation || !animation.frames[this.frameIndex]) return;

    const currentFrame = animation.frames[this.frameIndex];
    if (!currentFrame.complete) return;

    ctx.save();

    if (!this.facingRight) {
      ctx.translate(this.position.x + this.width, this.position.y);
      ctx.scale(-1, 1);
      ctx.drawImage(currentFrame, 0, 0, this.width, this.height);
    } else {
      ctx.drawImage(
        currentFrame,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }

    ctx.restore();
    this.drawHealthBar();
  }

  checkAttackCollisions() {
    if (!this.states.attacking) return;

    const attackX = this.facingRight
      ? this.position.x + this.width
      : this.position.x - this.attackBox.width;

    const attackY = this.position.y + this.attackBox.offsetY;

    levelManager.enemyManager.enemies.forEach((enemy) => {
      if (this.checkAttackHit(enemy, attackX, attackY)) {
        if (!enemy.isHit) {
          enemy.takeHit(this.attackDamage);
          enemy.isHit = true;

          setTimeout(() => {
            enemy.isHit = false;
          }, this.attackCooldown);
        }
      }
    });
  }

  checkAttackHit(enemy, attackX, attackY) {
    return (
      attackX < enemy.position.x + enemy.width &&
      attackX + this.attackBox.width > enemy.position.x &&
      attackY < enemy.position.y + enemy.height &&
      attackY + this.attackBox.height > enemy.position.y
    );
  }

  checkCollisions() {
    const blocks = [...levelManager.collisionBlocks];
    let wasOnGround = this.onGround;
    this.onGround = false;

    for (const block of blocks) {
      if (this.checkCollision(block)) {
        this.resolveCollision(block);

        // If we've landed, reset jump state
        if (!wasOnGround && this.onGround && this.states.jumping) {
          this.setState(keys.ArrowRight || keys.ArrowLeft ? "run" : "idle");
        }
      }
    }
  }

  checkCollision(block) {
    return (
      this.position.x + this.width > block.position.x &&
      this.position.x < block.position.x + block.width &&
      this.position.y + this.height > block.position.y &&
      this.position.y < block.position.y + block.height
    );
  }

  resolveCollision(block) {
    const playerBottom = this.position.y + this.height;
    const playerTop = this.position.y;
    const playerLeft = this.position.x;
    const playerRight = this.position.x + this.width;

    const blockBottom = block.position.y + block.height;
    const blockTop = block.position.y;
    const blockLeft = block.position.x;
    const blockRight = block.position.x + block.width;

    const overlapTop = playerBottom - blockTop;
    const overlapBottom = blockBottom - playerTop;
    const overlapLeft = playerRight - blockLeft;
    const overlapRight = blockRight - playerLeft;

    if (
      overlapTop < overlapBottom &&
      overlapTop < overlapLeft &&
      overlapTop < overlapRight
    ) {
      this.position.y = blockTop - this.height;
      this.velocityY = 0;
      this.onGround = true;
    } else if (
      overlapBottom < overlapTop &&
      overlapBottom < overlapLeft &&
      overlapBottom < overlapRight
    ) {
      this.position.y = blockBottom;
      this.velocityY = 0;
    } else if (
      overlapLeft < overlapRight &&
      overlapLeft < overlapTop &&
      overlapLeft < overlapBottom
    ) {
      this.position.x = blockLeft - this.width;
    } else if (
      overlapRight < overlapLeft &&
      overlapRight < overlapTop &&
      overlapRight < overlapBottom
    ) {
      this.position.x = blockRight;
    }
  }

  drawHealthBar() {
    const healthRatio = this.health / this.maxHealth;
    const barHeight = 5;
    const barX = this.position.x;
    const barY = this.position.y - barHeight - 5;

    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, this.healthBarWidth, barHeight);

    ctx.fillStyle = "green";
    ctx.fillRect(barX, barY, this.healthBarWidth * healthRatio, barHeight);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(barX, barY, this.healthBarWidth, barHeight);
  }

  die() {
    // Prevent multiple simultaneous death calls
    if (this.isDead || this.isDeathProcessActive) return;

    this.isDeathProcessActive = true;
    this.isDead = true;

    // Play death sound
    this.deathSound.play();

    // Force death state and reset frame
    this.setState("dead");
    this.frameIndex = 0;

    // Ensure full death animation duration
    const deathAnimation = this.animations.dead;
    const animationDuration = deathAnimation.frameCount * this.frameInterval;

    // Prevent movement or actions during death
    Object.keys(keys).forEach((key) => (keys[key] = false));

    setTimeout(() => {
      if (this.lives > 0) {
        this.lives--;
        this.respawn();
      } else {
        this.gameOver();
      }
    }, animationDuration);
  }

  respawn() {
    // Ensure clean respawn
    this.isDeathProcessActive = false;
    this.isDead = false;

    // Get current level data
    const currentLevelKey = levelManager.levels[levelManager.currentLevelIndex];
    const currentLevelData = LEVEL_DATA[currentLevelKey];

    // Complete reset of player state
    this.health = this.maxHealth;
    this.velocityY = 0;
    this.onGround = false;

    // Explicitly set to level start position
    this.position = {
      x: currentLevelData.startPosition.x,
      y: currentLevelData.startPosition.y,
    };

    // Reset player states
    this.setState("idle");
    this.facingRight = true;

    // Comprehensive level reload with minimal delay
    levelManager.loadCurrentLevel();
  }

  gameOver() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Prevent further interactions
    Object.keys(keys).forEach((key) => (keys[key] = false));

    // Clear canvas and prepare for game over screen
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Game over text styling
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Animated game over text
    let frameCount = 0;
    const animateGameOver = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pulsating effect
      const scale = 1 + Math.sin(frameCount * 0.2) * 0.1;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.fillText("GAME OVER", 0, 0);
      ctx.restore();

      frameCount++;

      if (frameCount < 180) {
        // Animate for 3 seconds
        requestAnimationFrame(animateGameOver);
      } else {
        // Reset entire game state
        levelManager.currentLevelIndex = 0;
        levelManager.loadCurrentLevel();

        // Reset player completely
        this.lives = 3;
        this.health = this.maxHealth;
        this.isDead = false;
        this.isDeathProcessActive = false;
        this.setState("idle");
      }
    };

    animateGameOver();
    ctx.restore();
  }

  updateAnimation() {
    // Enhanced animation update with special handling for death
    if (Date.now() - this.frameTimer > this.frameInterval) {
      const animation = this.animations[this.currentState];

      if (this.currentState === "dead") {
        // For death animation, play once and stop at last frame
        if (this.frameIndex < animation.frameCount - 1) {
          this.frameIndex++;
        }
      } else if (animation.loop) {
        this.frameIndex = (this.frameIndex + 1) % animation.frameCount;
      } else {
        // Handle other non-looping animations
        if (this.frameIndex < animation.frameCount - 1) {
          this.frameIndex++;
        }
      }

      this.frameTimer = Date.now();
    }
  }
}


const debug = false;

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false
};

// Event listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        e.preventDefault();
    }
});