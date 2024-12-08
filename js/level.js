class Level {
    constructor(maplocation) {
        this.mapname = new Image();
        this.mapname.src = maplocation;
        this.imageLoaded = false;
        this.camera = {
            x: 0,
            y: 0
        };

        // Set level dimensions once the image is loaded
        this.mapname.onload = () => {
            this.imageLoaded = true;
            this.width = this.mapname.width;
            this.height = this.mapname.height;
            // Set ground level - adjust this based on your map
            this.groundLevel = this.height - 80; // 80 pixels from bottom
        };
    }

    updateCamera(player) {
        // Calculate the desired camera position (centered on player)
        const targetX = player.position.x - canvas.width / 2 + player.width / 2;
        const targetY = player.position.y - canvas.height / 2 + player.height / 2;

        // Calculate the maximum camera positions
        const maxX = this.width - canvas.width;
        const maxY = this.height - canvas.height;

        // Update camera position with bounds checking
        this.camera.x = Math.max(0, Math.min(targetX, maxX));
        this.camera.y = Math.max(0, Math.min(targetY, maxY));
    }

    update(player) {
        if (this.imageLoaded) {
            this.updateCamera(player);
            ctx.save();
            ctx.translate(-this.camera.x, -this.camera.y);
            ctx.drawImage(this.mapname, 0, 0);
            ctx.restore();
        }
    }

    // Method to check if a position is within map bounds
    isInBounds(x, y, width, height) {
        return (
            x >= 0 && 
            x + width <= this.width && 
            y >= 0 && 
            y + height <= this.height
        );
    }
}