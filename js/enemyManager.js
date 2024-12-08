class EnemyManager {
    constructor() {
        this.enemies = [];
        this.enemyTypes = {
            dog: (position) => new Dog(position),
            canine: (position) => new Canine(position),
            goblin: (position) => new Goblin(position),
            nightborne: (position) => new Nightborne(position),
            flyingDemon: (position) => new FlyingDemon(position),
            fireProjectile: (position) => new FireProjectile(position),
            soldier: (position) => new Soldier(position),
        };
    }

    addEnemy(type, position) {
        if (this.enemyTypes[type]) {
            this.enemies.push(this.enemyTypes[type](position));
        }
    }

    clearEnemies() {
        this.enemies = [];
    }

    update(player, collisionBlocks) {
        this.enemies = this.enemies.filter(enemy => !enemy.isDead);
        
        this.enemies.forEach(enemy => {
            enemy.update(player, collisionBlocks);
        });
    }

    draw(ctx) {
        this.enemies.forEach(enemy => {
            enemy.draw(ctx);
        });
    }

    areAllEnemiesDead() {
        return this.enemies.length === 0;
    }
}
