const ItemFactory = {
    createXP: function(x, y, value) {
        Game.items.push(new XPOrb(x, y, value));
    },
    createCoin: function(x, y, value) {
        Game.items.push(new Coin(x, y, value));
    },
    createChest: function() {
        // Haritada rastgele bir yere sandık at
        let x = Math.random() * (Game.map.width - 200) + 100;
        let y = Math.random() * (Game.map.height - 200) + 100;
        // Markete çok yakın olmasın
        let d = Math.sqrt((x-Game.shop.x)**2 + (y-Game.shop.y)**2);
        if (d > Game.shop.safeZoneRadius + 100) {
            Game.chests.push(new Chest(x, y));
            // Efekt: Sandık düştü işareti
            Effects.showDamage(x, y, "SANDIK DÜŞTÜ!", "#ffa500");
        }
    }
};

class XPOrb {
    constructor(x, y, value) {
        this.x = x; this.y = y; this.value = value;
        this.radius = 8; this.markedForDeletion = false;
        this.isMagnetized = false; this.speed = 0;
        this.acceleration = 1500;
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    update(dt) {
        if (this.isMagnetized) {
            let dx = Game.player.x - this.x;
            let dy = Game.player.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            this.speed += this.acceleration * dt;
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
    draw(ctx) {
        let bobY = Math.sin(Date.now() / 200 + this.floatOffset) * 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffaa'; ctx.fill();
        ctx.shadowColor = '#00ffaa'; ctx.shadowBlur = 10;
        ctx.stroke(); ctx.shadowBlur = 0;
    }
    collect() {
        this.markedForDeletion = true;
        Game.player.gainXp(this.value);
    }
}

class Coin {
    constructor(x, y, value) {
        this.x = x; this.y = y; this.value = value;
        this.radius = 10; this.markedForDeletion = false;
        this.isMagnetized = false; this.speed = 0;
        this.acceleration = 1500;
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    update(dt) {
        if (this.isMagnetized) {
            let dx = Game.player.x - this.x;
            let dy = Game.player.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            this.speed += this.acceleration * dt;
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
    draw(ctx) {
        let bobY = Math.sin(Date.now() / 150 + this.floatOffset) * 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; ctx.fill();
        ctx.fillStyle = '#B8860B'; ctx.font = '12px Arial';
        ctx.textAlign = 'center'; ctx.fillText('$', this.x, this.y + bobY + 4);
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
        ctx.stroke(); ctx.shadowBlur = 0;
    }
    collect() {
        this.markedForDeletion = true;
        Game.player.gainCoins(this.value);
    }
}

class Chest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.markedForDeletion = false;
        this.angle = 0;
    }

    open() {
        if(this.markedForDeletion) return;
        this.markedForDeletion = true;
        Effects.spawnExplosion(this.x, this.y); // Görsel efekt
        // Özel sandık menüsü (Sadece 1 kart, ama bedava özellik)
        UI.showUpgradeMenu(true); 
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Hazine sandığı görüntüsü (Basit geometrik)
        ctx.fillStyle = '#8B4513'; // Kahverengi
        ctx.fillRect(-20, -15, 40, 30);
        
        ctx.fillStyle = '#FFD700'; // Altın şeritler
        ctx.fillRect(-20, -5, 40, 5);
        ctx.fillRect(-5, -15, 10, 30);
        
        // Parlama efekti
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-20, -15, 40, 30);
        
        ctx.shadowBlur = 0;
        
        // Üstünde ok işareti
        let bob = Math.sin(Date.now()/200) * 5;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -30 + bob);
        ctx.lineTo(-10, -45 + bob);
        ctx.lineTo(10, -45 + bob);
        ctx.fill();
        
        ctx.restore();
    }
}
