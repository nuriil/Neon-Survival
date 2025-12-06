class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gridSize = 100;
        
        // Engelleri oluştur
        this.obstacles = [];
        this.generateObstacles();
    }

    generateObstacles() {
        // Haritaya rastgele 50-60 engel atalım
        let count = 60;
        let safeDist = Game.shop.safeZoneRadius + 200; // Marketin dibinde doğmasınlar

        for(let i = 0; i < count; i++) {
            let typeRandom = Math.random();
            let type = 'tree';
            let radius = 40;

            if (typeRandom < 0.4) {
                type = 'rock'; // %40 Kaya
                radius = 35;
            } else if (typeRandom < 0.7) {
                type = 'bush'; // %30 Çalı (Daha küçük)
                radius = 25;
            } else {
                type = 'crate'; // %30 Kutu
                radius = 30;
            }

            let valid = false;
            let ox, oy;
            let attempts = 0;

            // Uygun konum bulana kadar dene
            while(!valid && attempts < 20) {
                attempts++;
                ox = Math.random() * (this.width - 100) + 50;
                oy = Math.random() * (this.height - 100) + 50;

                // Markete çok yakın mı?
                let distShop = Math.sqrt((ox - Game.shop.x)**2 + (oy - Game.shop.y)**2);
                if (distShop > safeDist) {
                    valid = true;
                    // Diğer engellerle çakışıyor mu?
                    for(let obs of this.obstacles) {
                        let distObs = Math.sqrt((ox - obs.x)**2 + (oy - obs.y)**2);
                        if(distObs < radius + obs.radius + 20) {
                            valid = false;
                            break;
                        }
                    }
                }
            }

            if(valid) {
                this.obstacles.push({ x: ox, y: oy, radius: radius, type: type });
            }
        }
    }

    draw(ctx, camera) {
        // Culling (Sadece ekrandakileri çiz)
        let startX = Math.floor(camera.x / this.gridSize) * this.gridSize;
        let startY = Math.floor(camera.y / this.gridSize) * this.gridSize;
        let endX = startX + ctx.canvas.width + this.gridSize;
        let endY = startY + ctx.canvas.height + this.gridSize;

        // Izgara Çizimi
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

        // Engelleri Çiz
        this.drawObstacles(ctx);
    }

    drawObstacles(ctx) {
        for(let obs of this.obstacles) {
            // Basit Culling (Ekran dışındaysa çizme)
            if(obs.x < Game.camera.x - 100 || obs.x > Game.camera.x + Game.width + 100 ||
               obs.y < Game.camera.y - 100 || obs.y > Game.camera.y + Game.height + 100) continue;

            ctx.save();
            ctx.translate(obs.x, obs.y);

            // Gölge
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.arc(10, 10, obs.radius, 0, Math.PI*2);
            ctx.fill();

            if (obs.type === 'rock') {
                // Kaya Görünümü
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.arc(0, 0, obs.radius, 0, Math.PI*2);
                ctx.fill();
                // Kaya detayı
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.arc(-10, -10, obs.radius/2, 0, Math.PI*2);
                ctx.fill();

            } else if (obs.type === 'tree') {
                // Ağaç Gövdesi
                ctx.fillStyle = '#4a3728'; // Kahverengi
                ctx.beginPath();
                ctx.arc(0, 0, obs.radius * 0.3, 0, Math.PI*2);
                ctx.fill();
                // Ağaç Yaprakları
                ctx.fillStyle = '#2d6a4f'; // Koyu yeşil
                ctx.beginPath();
                ctx.arc(0, 0, obs.radius, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#40916c'; // Açık yeşil detay
                ctx.beginPath();
                ctx.arc(-5, -5, obs.radius * 0.6, 0, Math.PI*2);
                ctx.fill();

            } else if (obs.type === 'crate') {
                // Kutu Görünümü (Kare)
                ctx.fillStyle = '#8b5e3c';
                ctx.fillRect(-obs.radius, -obs.radius, obs.radius*2, obs.radius*2);
                // Çarpı işareti
                ctx.strokeStyle = '#5c3a21';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-obs.radius, -obs.radius);
                ctx.lineTo(obs.radius, obs.radius);
                ctx.moveTo(obs.radius, -obs.radius);
                ctx.lineTo(-obs.radius, obs.radius);
                ctx.stroke();
                // Çerçeve
                ctx.strokeRect(-obs.radius, -obs.radius, obs.radius*2, obs.radius*2);
            } else {
                // Çalı
                ctx.fillStyle = '#55a630';
                ctx.beginPath();
                ctx.arc(0, 0, obs.radius, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.restore();
        }
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
