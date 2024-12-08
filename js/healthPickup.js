class HealthPickup {
  constructor(position) {
    this.position = position;
    this.width = 32; // Standard pickup size
    this.height = 32;
    this.isActive = true;

    // Animation frames with separate images
    this.frames = [new Image(), new Image(), new Image(), new Image()];

    // Set image sources for each frame
    this.frames[0].src = "../assets/images/pickups/healthkit/health (1).png";
    this.frames[1].src = "../assets/images/pickups/healthkit/health (2).png";
    this.frames[2].src = "../assets/images/pickups/healthkit/health (3).png";
    this.frames[3].src = "../assets/images/pickups/healthkit/health (4).png";

    // Animation properties
    this.frameCount = 4;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameInterval = 200; // 200ms between frames

    // Error handling for image loading
    this.frames.forEach((frame, index) => {
      frame.onerror = () => {
        console.error(`Failed to load health pickup frame ${index + 1}`);
      };
    });
  }

  update() {
    // Animate the health pickup
    if (Date.now() - this.frameTimer > this.frameInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.frameTimer = Date.now();
    }
  }

  draw(ctx) {
    if (!this.isActive) return;

    const currentImage = this.frames[this.currentFrame];

    // Only draw if the image is loaded
    if (currentImage.complete) {
      ctx.save();
      ctx.drawImage(
        currentImage,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
      ctx.restore();
    }
  }

  checkCollision(player) {
    if (!this.isActive) return false;

    return (
      player.position.x + player.width > this.position.x &&
      player.position.x < this.position.x + this.width &&
      player.position.y + player.height > this.position.y &&
      player.position.y < this.position.y + this.height
    );
  }

  collect(player) {
    if (!this.isActive) return false;

    const healAmount = 50; // Amount of health to restore
    const maxHeal = Math.min(player.maxHealth - player.health, healAmount);

    if (maxHeal > 0) {
      player.health += maxHeal;

      // Optional: Play pickup sound
      const pickupSound = new Audio(
        "../assets/audio/sound_effects/pickup/health.mp3"
      );
      pickupSound.play();

      // Deactivate the pickup
      this.isActive = false;
      return true;
    }

    return false;
  }
}

class HealthPickupManager {
  constructor() {
    this.pickups = [];
  }

  spawnHealthPickup(position) {
    const pickup = new HealthPickup(position);
    this.pickups.push(pickup);
    return pickup;
  }

  update(player) {
    this.pickups.forEach((pickup) => {
      pickup.update();

      // Check for player collision
      if (pickup.checkCollision(player)) {
        pickup.collect(player);
      }
    });

    // Remove inactive pickups
    this.pickups = this.pickups.filter((pickup) => pickup.isActive);
  }

  draw(ctx) {
    this.pickups.forEach((pickup) => pickup.draw(ctx));
  }

  // Optional method to spawn health pickups in levels
  spawnLevelPickups(levelData) {
    if (levelData.healthPickupPositions) {
      levelData.healthPickupPositions.forEach((pos) => {
        this.spawnHealthPickup(pos);
      });
    }
  }
}
