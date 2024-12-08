class FireProjectile {
  constructor(position, direction, speed = 4) {
    this.position = position; // Starting position
    this.direction = direction; // -1 for left, 1 for right
    this.speed = speed; // Speed of the fire
    this.width = 50; // Fire width
    this.height = 30; // Fire height
    this.isActive = true; // Whether the fire is still active
    this.lifeTime = 3000; // Fire lives for 3 seconds (3,000 ms)

    // Set a timeout to deactivate the fire after 3 seconds
    setTimeout(() => {
      this.isActive = false;
    }, this.lifeTime);
  }

  // Update the fire's position and check collision with the player
  update() {
    this.position.x += this.speed * this.direction; // Move fire in the X direction

    // If fire is still active, check for collision
    if (this.isActive) {
      return true; // Fire is still active
    }

    return false; // Fire is deactivated after 3 seconds
  }

  // Draw fire
  draw(ctx) {
    let fire = new Image()
    fire.src = "assets\/images\/characters\/level enemies\/level2\/flyingDemon\/projectile.png"
    ctx.drawImage(fire, this.position.x, this.position.y, this.width, this.height);
  }
}
