class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gridSize = 100;
    }

    draw(ctx, camera) {
        // Performans için sadece görünen alanı çiz (Culling)
        let startX = Math.floor(camera.x / this.gridSize) * this.gridSize;
        let startY = Math.floor(camera.y / this.gridSize) * this.gridSize;
        let endX = startX + ctx.canvas.width + this.gridSize;
        let endY = startY + ctx.canvas.height + this.gridSize;

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Dikey çizgiler
        for (let x = startX; x <= endX; x += this.gridSize) {
            if (x < 0 || x > this.width) continue;
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        // Yatay çizgiler
        for (let y = startY; y <= endY; y += this.gridSize) {
            if (y < 0 || y > this.height) continue;
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();

        // Harita Sınırları (Parlayan kırmızı çerçeve)
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, this.width, this.height);
    }
}