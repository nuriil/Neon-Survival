class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gridSize = 100;
    }

    draw(ctx, camera) {
        // Culling
        let startX = Math.floor(camera.x / this.gridSize) * this.gridSize;
        let startY = Math.floor(camera.y / this.gridSize) * this.gridSize;
        let endX = startX + ctx.canvas.width + this.gridSize;
        let endY = startY + ctx.canvas.height + this.gridSize;

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let x = startX; x <= endX; x += this.gridSize) {
            if (x < 0 || x > this.width) continue;
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += this.gridSize) {
            if (y < 0 || y > this.height) continue;
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();

        // Harita Sınırları
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, this.width, this.height);
    }

    drawShop(ctx) {
        const s = Game.shop;
        
        // Güvenli Alan Çemberi (Yerdeki yeşil çizgi)
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.safeZoneRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
        ctx.lineWidth = 5;
        ctx.setLineDash([20, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Market Binası
        ctx.fillStyle = '#444';
        ctx.fillRect(s.x - s.radius, s.y - s.radius, s.radius*2, s.radius*2);
        
        // Çatı / Tente
        ctx.beginPath();
        ctx.moveTo(s.x - s.radius - 10, s.y - s.radius);
        ctx.lineTo(s.x, s.y - s.radius - 80);
        ctx.lineTo(s.x + s.radius + 10, s.y - s.radius);
        ctx.fillStyle = '#e63946'; // Kırmızı çatı
        ctx.fill();

        // MARKET Yazısı
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("MARKET", s.x, s.y - s.radius + 10);

        // Kapı
        ctx.fillStyle = '#222';
        ctx.fillRect(s.x - 25, s.y + s.radius - 60, 50, 60);
    }
}

