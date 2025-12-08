const ItemFactory = {
    createXP: function(x, y, value) {
        Game.items.push(new XPOrb(x, y, value));
    },
    createCoin: function(x, y, value) {
        Game.items.push(new Coin(x, y, value));
    },
    createChest: function() {
        let x = Math.random() * (Game.map.width - 200) + 100;
        let y = Math.random() * (Game.map.height - 200) + 100;
        
        let d = Math.sqrt((x-Game.shop.x)**2 + (y-Game.shop.y)**2);
        if (d > Game.shop.safeZoneRadius + 100) {
            Game.chests.push(new Chest(x, y));
            UI.showNotification("SANDIK DÜŞTÜ!", "#00ff00");
        }
    },
    // YENİ: Pasif eşya oluşturma fonksiyonu
    createPassiveItem: function(x, y, itemId) {
        Game.items.push(new PassiveItemDrop(x, y, itemId));
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
        Effects.spawnExplosion(this.x, this.y); 
        
        let amount = 0;
        let r = Math.random();
        
        if (r < 0.6) {
            amount = Math.floor(500 + Math.random() * 500);
        } else if (r < 0.9) {
            amount = Math.floor(1000 + Math.random() * 1000);
        } else {
            amount = Math.floor(2000 + Math.random() * 1000);
        }

        Game.player.gainCoins(amount);
        UI.showNotification("SANDIK AÇILDI: " + amount + " 💰", "#FFD700");
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = '#8B4513'; 
        ctx.fillRect(-20, -15, 40, 30);
        
        ctx.fillStyle = '#FFD700'; 
        ctx.fillRect(-20, -5, 40, 5);
        ctx.fillRect(-5, -15, 10, 30);
