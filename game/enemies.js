const EnemySpawner = {
    timer: 0,
    spawnRate: 2.5, // BAŞLANGIÇ: Daha yavaş spawn (2.5 saniye)
    
    reset: function() {
        this.timer = 0;
        this.spawnRate = 2.5; 
        Game.enemies = [];
    },

    update: function(dt) {
        this.timer -= dt;
        
        // ZORLUK AYARI: Player leveline göre spawn hızını güncelle
        // Level 1: 2.5sn, Level 10: 2.0sn, Level 20: 1.5sn gibi yavaş bir artış.
        // Minimum 0.4 saniyeye kadar düşebilir (çok ileriki levellerde).
        let currentLevel = Game.player ? Game.player.level : 1;
        let targetRate = Math.max(0.4, 2.5 - (currentLevel * 0.05));
        
        if (this.timer <= 0) {
            this.spawnBatch(currentLevel);
            this.timer = targetRate;
        }
    },

    spawnBatch: function(level) {
        // Güvenli alanın DIŞINDA spawn olmalı
        let validPos = false;
        let px, py;
        let safeDist = Game.shop.safeZoneRadius + 200;

        // Level arttıkça aynı anda doğan düşman sayısı çok yavaş artsın
        // Level 1-4: 1 düşman
        // Level 5-9: 2 düşman
        // Level 10+: artarak gider
        let count = 1 + Math.floor(level / 5);
        if (count > 6) count = 6; // Maksimum limit

        for(let i = 0; i < count; i++) {
            validPos = false;
            let attempts = 0;
            while(!validPos && attempts < 10) {
                attempts++;
                let angle = Math.random() * Math.PI * 2;
                let dist = 700 + Math.random() * 200; 
                px = Game.player.x + Math.cos(angle) * dist;
                py = Game.player.y + Math.sin(angle) * dist;
                
                // Harita sınırları
                px = Math.max(50, Math.min(px, Game.map.width - 50));
                py = Math.max(50, Math.min(py, Game.map.height - 50));

                // Marketten yeterince uzak mı?
                let distShop = Math.sqrt((px - Game.shop.x)**2 + (py - Game.shop.y)**2);
                if (distShop > safeDist) validPos = true;
            }

            // Boss çıkma ihtimali (Skora göre değil level moduna göre)
            // Her 5 levelda bir boss şansı artar
            let isBoss = (level % 5 === 0) && (Math.random() < 0.2); // %20 şansla boss
            
            if (validPos) {
                 Game.enemies.push(new Enemy(px, py, isBoss ? 'boss' : 'zombie'));
            }
        }
    }
};

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        this.pushX = 0;
        this.pushY = 0;
        
        let level = Game.player ? Game.player.level : 1;

        if (type === 'boss') {
            this.radius = 45;
            this.speed = 85 + (level * 2);
            this.hp = 500 * (1 + level * 0.2); // Boss HP'si levella artar
            this.color = '#ff0000';
            this.damage = 30;
            this.xpValue = 200;
        } else {
            this.radius = 15;
            // Zombi hızı çok yavaş artar
            this.speed = 100 + (level * 1.5); 
            // HP: Level 1'de kolay (50), sonra azar azar artar
            this.hp = 50 + (level * 10); 
            this.color = '#ff5555';
            this.damage = 5 + Math.floor(level * 0.5);
            this.xpValue = 10 + Math.floor(level * 2);
        }
    }

    update(dt) {
        // Safe Zone Kontrolü (Geri itme)
        let distToShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        if (distToShop < Game.shop.safeZoneRadius) {
            let angle = Math.atan2(this.y - Game.shop.y, this.x - Game.shop.x);
            this.x += Math.cos(angle) * 200 * dt;
            this.y += Math.sin(angle) * 200 * dt;
            return; 
        }

        // Oyuncuya yönel
        let dx = Game.player.x - this.x;
        let dy = Game.player.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }

        // Separation (Birbirinin içine girmeme)
        Game.enemies.forEach(other => {
            if (other === this) return;
            let ox = this.x - other.x;
            let oy = this.y - other.y;
            let odist = Math.sqrt(ox*ox + oy*oy);
            if (odist < (this.radius + other.radius)) {
                let force = 150 / (odist * odist + 0.1);
                this.pushX += (ox / odist) * force;
                this.pushY += (oy / odist) * force;
            }
        });

        this.pushX *= 0.9;
        this.pushY *= 0.9;

        this.x += (dx * this.speed + this.pushX) * dt;
        this.y += (dy * this.speed + this.pushY) * dt;
    }

    draw(ctx) {
        ctx.beginPath();
        let wobble = Math.sin(Date.now() / 100) * 2;
        
        if (this.type === 'boss') {
            ctx.rect(this.x - this.radius, this.y - this.radius, this.radius*2, this.radius*2);
        } else {
            ctx.arc(this.x, this.y, this.radius + (wobble > 0 ? 1 : 0), 0, Math.PI * 2);
        }
        
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#330000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gözler
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI*2);
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI*2);
        ctx.fill();
    }

    takeDamage(amount) {
        this.hp -= amount;
        Effects.spawnBlood(this.x, this.y, '#880000');
        Effects.showDamage(this.x, this.y - 20, amount);
        
        // Vurulunca biraz geri itilme
        let angle = Math.atan2(this.y - Game.player.y, this.x - Game.player.x);
        this.pushX += Math.cos(angle) * 120;
        this.pushY += Math.sin(angle) * 120;

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            Game.score += (this.type === 'boss' ? 50 : 1); // Skor artışı
            UI.updateScore(Game.score);
            Effects.spawnExplosion(this.x, this.y);
        }
    }
}
