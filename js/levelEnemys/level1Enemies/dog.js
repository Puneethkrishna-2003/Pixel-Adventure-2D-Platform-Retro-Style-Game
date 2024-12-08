class Dog {
    constructor(position = { x: 500, y: 200 }) {
        // Core properties
        this.position = position;
        this.width = 48;
        this.height = 38;
        this.speed = 2;
        this.direction = 1; // 1 for right, -1 for left
        
        // Physics properties
        this.gravity = 0.3;
        this.velocityY = 0;
        this.onGround = false;
        
        // Combat properties
        this.health = 100;
        this.maxHealth = 100;
        this.attackDamage = 4;
        this.attackRange = 40;
        this.attackCooldown = 1000; // ms
        this.lastAttackTime = 0;
        this.boundaryRadius = 200; // Detection range
        
        // Animation properties
        this.currentState = 'idle';
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = 100; // ms between frames
        this.facingRight = true;
        
        // Hit effect properties
        this.isHit = false;
        this.hitFlashDuration = 200;
        this.hitStartTime = 0;
        this.knockbackForce = 5;
        this.knockbackDuration = 200;
        this.invulnerableTime = 500; // ms of invulnerability after hit
        this.lastHitTime = 0;
        
        // Death properties
        this.isDead = false;
        this.isDying = false;
        this.deathStartTime = 0;
        this.deathAnimationDuration = 1000;
        this.dropExperience = 10;

        //sound properties
        this.attackSound = new Audio('assets\/audio\/sound_effects\/level1\/dog\/dogbark.mp3');
        this.hurtSound = new Audio('assets\/audio\/sound_effects\/level1\/dog\/doghurt.mp3');
        this.deathSound = new Audio('assets/sounds/death.mp3');
        
        // Initialize animations
        this.animations = {
            idle: {
                frames: [],
                frameCount: 4,
                framePaths: ['Idle1.png', 'Idle2.png', 'Idle3.png', 'Idle4.png'],
                loop: true
            },
            walk: {
                frames: [],
                frameCount: 6,
                framePaths: ['Walk1.png', 'Walk2.png', 'Walk3.png', 'Walk4.png', 'Walk5.png', 'Walk6.png'],
                loop: true
            },
            attack: {
                frames: [],
                frameCount: 4,
                framePaths: ['Attack1.png', 'Attack2.png', 'Attack3.png', 'Attack4.png'],
                loop: true
            },
            hurt: {
                frames: [],
                frameCount: 2,
                framePaths: ['Hurt1.png', 'Hurt2.png'],
                loop: false
            },
            death: {
                frames: [],
                frameCount: 4,
                framePaths: ['Death1.png', 'Death2.png', 'Death3.png', 'Death4.png'],
                loop: false
            }
        };
        
        this.loadAnimations();
    }

    loadAnimations() {
        const basePath = 'assets/images/characters/level enemies/level1/dog/';
        Object.keys(this.animations).forEach(state => {
            this.animations[state].frames = this.animations[state].framePaths.map(path => {
                const img = new Image();
                img.src = basePath + path;
                img.onerror = () => console.error(`Failed to load: ${basePath + path}`);
                return img;
            });
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
        const dogBottom = this.position.y + this.height;
        const dogTop = this.position.y;
        const dogLeft = this.position.x;
        const dogRight = this.position.x + this.width;
        
        const blockBottom = block.position.y + block.height;
        const blockTop = block.position.y;
        const blockLeft = block.position.x;
        const blockRight = block.position.x + block.width;
        
        const overlapTop = dogBottom - blockTop;
        const overlapBottom = blockBottom - dogTop;
        const overlapLeft = dogRight - blockLeft;
        const overlapRight = blockRight - dogLeft;
        
        // Find smallest overlap to determine collision direction
        if (Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight) === overlapTop) {
            this.position.y = blockTop - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }
    }

    // Combat
    takeHit(damage) {
        const currentTime = Date.now();
        
        // Check for invulnerability
        if (this.isDead || this.isDying || currentTime - this.lastHitTime < this.invulnerableTime) {
            return;
        }
        
        this.health = Math.max(0, this.health - damage);
        this.isHit = true;
        this.hitStartTime = currentTime;
        this.lastHitTime = currentTime;
        this.hurtSound.play();
        
        // Apply knockback
        const knockbackDirection = this.direction * -1;
        this.position.x += this.knockbackForce * knockbackDirection;
        
        if (this.health <= 0) {
            this.startDeath();
        } else {
            this.setState('hurt');
            setTimeout(() => {
                if (!this.isDead && !this.isDying) {
                    this.setState('idle');
                }
            }, this.hitFlashDuration);
        }
    }

    attackPlayer(player) {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime > this.attackCooldown) {
            player.takeDamage(this.attackDamage);
            this.attackSound.play(); // Play attack sound
            this.lastAttackTime = currentTime;
        }
    }

    // Death handling
    startDeath() {
        this.isDying = true;
        this.deathStartTime = Date.now();
        this.setState('death');
        this.speed = 0;
        
        setTimeout(() => {
            this.completeDeath();
        }, this.deathAnimationDuration);
    }

    completeDeath() {
        this.isDead = true;
        this.isDying = false;
        
        // Trigger death rewards or effects
        if (typeof this.onDeath === 'function') {
            this.onDeath(this.dropExperience);
        }
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
        
        // Reset hit effect
        if (this.isHit && Date.now() - this.hitStartTime > this.hitFlashDuration) {
            this.isHit = false;
        }
        
        // Skip other updates if dying
        if (this.isDying) {
            this.updateAnimation();
            return;
        }
        
        this.applyGravity();
        this.checkCollisions(blocks);
        
        // AI behavior
        const distanceToPlayer = Math.abs(this.position.x - player.position.x);
        const heightDifference = Math.abs(this.position.y - player.position.y);
        
        // Only chase or attack if player is within reasonable height difference
        if (heightDifference < this.height * 2) {
            if (distanceToPlayer <= this.attackRange) {
                this.setState('attack');
                this.attackPlayer(player);
            } else if (distanceToPlayer <= this.boundaryRadius) {
                this.setState('walk');
                this.direction = player.position.x < this.position.x ? -1 : 1;
                this.position.x += this.speed * this.direction;
            } else {
                this.setState('idle');
            }
        }
        
        this.updateAnimation();
    }

    // Drawing
    drawHealthBar(ctx) {
        if (this.isDying || this.isDead) return;
        
        const healthRatio = this.health / this.maxHealth;
        const barHeight = 5;
        const barY = this.position.y - barHeight - 5;
        
        // Background (red)
        ctx.fillStyle = 'red';
        ctx.fillRect(this.position.x, barY, this.width, barHeight);
        
        // Health (green)
        ctx.fillStyle = 'green';
        ctx.fillRect(this.position.x, barY, this.width * healthRatio, barHeight);
        
        // Border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x, barY, this.width, barHeight);
    }

    draw(ctx) {
        if (this.isDead) return;
        
        const animation = this.animations[this.currentState];
        const currentFrame = animation.frames[this.frameIndex];
        
        if (!currentFrame || !currentFrame.complete) return;
        
        ctx.save();
        
        // Hit flash effect
        if (this.isHit && Date.now() - this.hitStartTime < this.hitFlashDuration) {
            ctx.globalCompositeOperation = 'color';
            ctx.fillStyle = '#FF0000';
            ctx.globalAlpha = 0.5;
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }
        
        // Death fade-out effect
        if (this.isDying) {
            const deathProgress = (Date.now() - this.deathStartTime) / this.deathAnimationDuration;
            ctx.globalAlpha = 1 - deathProgress;
        }
        
        // Draw sprite with direction handling
        if (this.direction === -1) {
            ctx.translate(this.position.x + this.width, this.position.y);
            ctx.scale(-1, 1);
            ctx.drawImage(currentFrame, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(currentFrame, this.position.x, this.position.y, this.width, this.height);
        }
        
        ctx.restore();
        
        // Draw health bar
        this.drawHealthBar(ctx);
    }
}
