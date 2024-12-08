class FlyingDemon {
  constructor(position = { x: 500, y: 200 }) {
    // Core properties
    this.position = position;
    this.width = 48;
    this.height = 48;
    this.speed = 2;
    this.direction = -1; // 1 for right, -1 for left

    // Physics properties
    this.gravity = 0.3;
    this.velocityY = 0;
    this.onGround = false;

    // Combat properties
    this.health = 80;
    this.maxHealth = 80;
    this.attackDamage = 8;
    this.attackRange = 200;
    this.attackCooldown = 3000; // ms
    this.lastAttackTime = 0;
    this.boundaryRadius = 300; // Detection range

    // Animation properties
    this.currentState = "idle";
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 100; // ms between frames
    this.facingRight = true;

    // Death properties
    this.isDead = false;
    this.isDying = false;
    this.deathStartTime = 0;
    this.deathAnimationDuration = 100;
    this.dropExperience = 1;

    // Fire projectile array
    this.fireProjectiles = []; // Array to store fire projectiles

    // Initialize animations
    this.animations = {
      idle: {
        frames: [],
        frameCount: 4,
        framePaths: [
          "idle (1).png",
          "idle (2).png",
          "idle (3).png",
          "idle (4).png",
        ],
        loop: true,
      },
      walk: {
        frames: [],
        frameCount: 4,
        framePaths: [
          "flying (1).png",
          "flying (2).png",
          "flying (3).png",
          "flying (4).png",
        ],
        loop: true,
      },
      attack: {
        frames: [],
        frameCount: 8,
        framePaths: [
          "attack (1).png",
          "attack (2).png",
          "attack (3).png",
          "attack (4).png",
          "attack (5).png",
          "attack (6).png",
          "attack (7).png",
          "attack (8).png",
        ],
        loop: true,
      },
      death: {
        frames: [],
        frameCount: 3,
        framePaths: ["death (1).png", "death (2).png", "death (3).png"],
        loop: false,
      },
    };

    this.loadAnimations();
  }

  loadAnimations() {
    const basePath =
      "assets/images/characters/level enemies/level2/flyingDemon/";
    Object.keys(this.animations).forEach((state) => {
      this.animations[state].frames = this.animations[state].framePaths.map(
        (path) => {
          const img = new Image();
          img.src = basePath + path;
          img.onerror = () =>
            console.error(`Failed to load: ${basePath + path}`);
          return img;
        }
      );
    });
  }

  // State Management
  setState(newState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.frameIndex = 0;
      this.frameTimer = Date.now();
    }
  }

  // Physics
  applyGravity() {
    if (!this.onGround) {
      this.velocityY += this.gravity;
      this.position.y += this.velocityY;
    }
  }

  checkCollisions(blocks) {
    this.onGround = false;

    for (const block of blocks) {
      if (this.checkCollision(block)) {
        this.resolveCollision(block);
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
    const demonBottom = this.position.y + this.height;
    const demonTop = this.position.y;
    const demonLeft = this.position.x;
    const demonRight = this.position.x + this.width;

    const blockBottom = block.position.y + block.height;
    const blockTop = block.position.y;
    const blockLeft = block.position.x;
    const blockRight = block.position.x + block.width;

    const overlapTop = demonBottom - blockTop;
    const overlapBottom = blockBottom - demonTop;
    const overlapLeft = demonRight - blockLeft;
    const overlapRight = blockRight - demonLeft;

    // Find smallest overlap to determine collision direction
    if (
      Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight) ===
      overlapTop
    ) {
      this.position.y = blockTop - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }
  }

  // Combat
  takeHit(damage) {
    if (this.isDead || this.isDying) return;

    this.health -= damage;

    if (this.health <= 0) {
      this.health = 0;
      this.startDeath();
    } else {
      this.setState("attack");
    }
  }

  attackPlayer(player) {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      // Create fire projectile
      const fire = new FireProjectile(
        {
          x: this.position.x + this.width / 2,
          y: this.position.y + this.height / 2,
        }, // Start at the mouth
        this.direction // Fire towards the player's direction
      );
      this.fireProjectiles.push(fire); // Add fire projectile to the array

      this.setState("attack");
      this.lastAttackTime = currentTime;
    }
  }

  // Death handling
  startDeath() {
    this.isDying = true;
    this.deathStartTime = Date.now();
    this.setState("death");
    this.speed = 0;

    setTimeout(() => {
      this.completeDeath();
    }, this.deathAnimationDuration);
  }

  completeDeath() {
    this.isDead = true;
    this.isDying = false;
  }

  // Animation
  updateAnimation() {
    if (Date.now() - this.frameTimer > this.frameInterval) {
      const animation = this.animations[this.currentState];

      if (animation.loop) {
        this.frameIndex = (this.frameIndex + 1) % animation.frameCount;
      } else if (this.frameIndex < animation.frameCount - 1) {
        this.frameIndex++;
      }

      this.frameTimer = Date.now();
    }
  }

  // Main update
  update(player, blocks) {
    if (this.isDead) return;

    // Check fire projectiles
    this.fireProjectiles.forEach((fire) => {
      if (fire.isActive && this.checkCollisionWithPlayer(fire, player)) {
        player.takeDamage(player.maxHealth * 0.5); // 50% health reduction
        fire.isActive = false; // Deactivate the fire projectile
      }
    });

    // Update fire projectiles
    this.fireProjectiles = this.fireProjectiles.filter((fire) => fire.update()); // Remove inactive projectiles

    this.applyGravity();
    this.checkCollisions(blocks);

    // AI behavior
    const distanceToPlayer = Math.abs(this.position.x - player.position.x);
    const heightDifference = Math.abs(this.position.y - player.position.y);

    // Only chase or attack if player is within reasonable height difference
    if (heightDifference < this.height * 2) {
      if (distanceToPlayer <= this.attackRange) {
        this.setState("attack");
        this.attackPlayer(player);
      } else if (distanceToPlayer <= this.boundaryRadius) {
        this.setState("walk");
        this.direction = player.position.x < this.position.x ? -1 : 1;
        this.position.x += this.speed * this.direction;
      } else {
        this.setState("idle");
      }
    }

    this.updateAnimation();
  }

  checkCollisionWithPlayer(fire, player) {
    return (
      fire.position.x < player.position.x + player.width &&
      fire.position.x + fire.width > player.position.x &&
      fire.position.y < player.position.y + player.height &&
      fire.position.y + fire.height > player.position.y
    );
  }

  // Drawing
  draw(ctx) {
    if (this.isDead) return;

    const animation = this.animations[this.currentState];
    const currentFrame = animation.frames[this.frameIndex];

    ctx.drawImage(
      currentFrame,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );

    // Draw the fire projectiles
    this.fireProjectiles.forEach((fire) => {
      fire.draw(ctx);
    });

    // Draw health bar
    this.drawHealthBar(ctx);
  }

  drawHealthBar(ctx) {
    const healthRatio = this.health / this.maxHealth;
    const barHeight = 5;
    const barY = this.position.y - barHeight - 5;

    // Background (red)
    ctx.fillStyle = "red";
    ctx.fillRect(this.position.x, barY, this.width, barHeight);

    // Health (green)
    ctx.fillStyle = "green";
    ctx.fillRect(this.position.x, barY, this.width * healthRatio, barHeight);

    // Border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.position.x, barY, this.width, barHeight);
  }
}
