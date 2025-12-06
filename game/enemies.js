const EnemySpawner = {
    timer: 0,
    spawnRate: 2.5, 
    
    reset: function() {
        this.timer = 0;
        this.spawnRate = 2.5; 
        Game.enemies = [];
    },

    update: function(dt) {
        this.timer -= dt;
        
        // ZORLUK DENGESİ:
        // Level 1: 2.5 sn
        // Her levelda süre %5 kısalır.
        // Min limit: 0.3 sn (Makineli tüfek gibi düşman yağar)
        let currentLevel = Game.player ? Game.player.level : 1;
        
        // Bu formül zorluğun yavaşça ama hissedilir şekilde artmasını sağlar
        let targetRate = Math.max(0.3, 2.5 * Math.pow(0.95, currentLevel - 1));
        
        if (this.timer <= 0) {
            this.spawnBatch(currentLevel);
            this.timer = targetRate;
        }
    },

    spawnBatch: function(level) {
        // Güvenli alanın DIŞINDA spawn olmalı
        let validPos = false;
        let px, py;
        let safeDist = Game.shop.safeZoneRadius + 150;

        // Level arttıkça sürü kalabalıklaşır
        // Level 1-3: 1-2 düşman
        // Level 10: 4-5 düşman
        // Formül: 1 + (Level / 4)
        let count = 1 + Math.floor(level / 4);
        count = Math.min(count, 8); // Tek seferde max 8 düşman spawn olsun (PC kasmasın)

        for(let i = 0; i < count; i++) {
            validPos = false;
            let attempts = 0;
            while(!validPos && attempts < 15) {
                attempts++;
                let angle = Math.random() * Math.PI * 2;
                // Oyuncunun etrafında rastgele bir çemberde doğarlar
                let dist = 600 + Math.random() * 300; 
                px = Game.player.x + Math.cos(angle) * dist;
                py = Game.player.y + Math.sin(angle) * dist;
                
                // Harita sınırları
                px = Math.max(50, Math.min(px, Game.map.width - 50));
                py = Math.max(50, Math.min(py, Game.map.height - 50));

                // Marketten yeterince uzak mı?
                let distShop = Math.sqrt((px - Game.shop.x)**2 + (py - Game.shop.y)**2);
                if (distShop > safeDist) validPos = true;
            }

            // Boss mantığı: Her 5 levelda bir boss gelme şansı başlar.
            // Level 5: %10, Level 10: %20...
            let bossChance = (level >= 5 && level % 5 === 0) ? 0.3 : 0.01;
            let isBoss = Math.random() < bossChance;
            
            if (validPos) {
                 Game.enemies.push(new Enemy(px, py, isBoss ? 'boss' : 'zombie', level));
            }
        }
    }
};

class Enemy {
    constructor(x, y, type, level) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        this.pushX = 0;
        this.pushY = 0;
        
        // ZORLUK STATLARI (Level'a göre güçlenme)
        let hpMulti = 1 + (level * 0.15); // Her level %15 daha fazla can
        let speedMulti = 1 + (level * 0.02); // Her level %2 daha hızlı (çok hızlanmasın)

        if (type === 'boss') {
            this.radius = 50;
            this.speed = 90 * speedMulti;
            this.hp = 600 * hpMulti; 
            this.color = '#ff0000';
            this.damage = 30 + level;
            this.xpValue = 200 + (level * 10);
        } else {
            this.radius = 16;
            this.speed = (100 + Math.random() * 40) * speedMulti;
            // Level 1 Zombi HP: 60
            // Level 10 Zombi HP: 150
            this.hp = 60 * hpMulti; 
            this.color = '#ff5555';
            this.damage = 1 + Math.floor(level * 0.5);
            this.xpValue = 10 + level;
        }
    }

    update(dt) {
        // Safe Zone Kontrolü (Geri itme)
        let distToShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        if (distToShop < Game.shop.safeZoneRadius) {
            let angle = Math.atan2(this.y - Game.shop.y, this.x - Game.shop.x);
            // Markete yaklaşınca çok hızlı geri itilirler
            this.x += Math.cos(angle) * 300 * dt;
            this.y += Math.sin(angle) * 300 * dt;
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

        // Sürü Psikolojisi (Separation - Birbirini itme)
        Game.enemies.forEach(other => {
            if (other === this) return;
            let ox = this.x - other.x;
            let oy = this.y - other.y;
            let odist = Math.sqrt(ox*ox + oy*oy);
            // Eğer çok yakınlarsa birbirlerini iterler
            if (odist < (this.radius + other.radius)) {
                let force = 200 / (odist * odist + 0.1);
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
            // Boss can barı (kafada)
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 20, this.y - 60, 40, 5);
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
        Effects.showDamage(this.x, this.y - 20, Math.floor(amount));
        
        // Vurulunca biraz geri itilme
        let angle = Math.atan2(this.y - Game.player.y, this.x - Game.player.x);
        this.pushX += Math.cos(angle) * 150;
        this.pushY += Math.sin(angle) * 150;

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            Game.score += (this.type === 'boss' ? 50 : 1);
            UI.updateScore(Game.score);
            Effects.spawnExplosion(this.x, this.y);
        }
    }
}





