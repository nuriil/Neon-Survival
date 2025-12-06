const EnemySpawner = {
    timer: 0,
    spawnRate: 2.0, 
    difficultyMultiplier: 2.0,

    reset: function() {
        this.timer = 0;
        this.spawnRate = 2.0;
        Game.enemies = [];
    },

    update: function(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.spawnBatch();
            this.timer = this.spawnRate;
            this.spawnRate = Math.max(0.2, 1.0 - (Game.score / 500));
        }
    },

    spawnBatch: function() {
        // Güvenli alanın DIŞINDA spawn olmalı
        let validPos = false;
        let px, py;
        let safeDist = Game.shop.safeZoneRadius + 200;

        while(!validPos) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 700; 
            px = Game.player.x + Math.cos(angle) * dist;
            py = Game.player.y + Math.sin(angle) * dist;
            
            // Harita sınırları
            px = Math.max(50, Math.min(px, Game.map.width - 50));
            py = Math.max(50, Math.min(py, Game.map.height - 50));

            // Marketten yeterince uzak mı?
            let distShop = Math.sqrt((px - Game.shop.x)**2 + (py - Game.shop.y)**2);
            if (distShop > safeDist) validPos = true;
        }

        if (Game.score > 0 && Game.score % 50 === 0) {
             Game.enemies.push(new Enemy(px, py, 'boss'));
        } else {
             Game.enemies.push(new Enemy(px, py, 'zombie'));
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

        if (type === 'boss') {
            this.radius = 40;
            this.speed = 80;
            this.hp = 800 * (1 + Game.gameLevel * 0.5); // Boss güçlendi
            this.color = '#ff0000';
            this.damage = 25;
            this.xpValue = 100;
        } else {
            this.radius = 15;
            this.speed = 110 + Math.random() * 30; // Biraz yavaşladı
            // DENGELEME: Pistol 25 vuruyor, 3 vuruş = 75 HP
            this.hp = 70 * (1 + Game.gameLevel * 0.1); 
            this.color = '#ff5555';
            this.damage = 1;
            this.xpValue = 10;
        }
    }

    update(dt) {
        // Safe Zone Kontrolü (Geri itme)
        let distToShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        if (distToShop < Game.shop.safeZoneRadius) {
            // Marketten dışarı doğru it
            let angle = Math.atan2(this.y - Game.shop.y, this.x - Game.shop.x);
            this.x += Math.cos(angle) * 200 * dt;
            this.y += Math.sin(angle) * 200 * dt;
            return; // Oyuncuya ilerleme iptal
        }

        // Oyuncuya yönel
        let dx = Game.player.x - this.x;
        let dy = Game.player.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }

        // Separation 
        Game.enemies.forEach(other => {
            if (other === this) return;
            let ox = this.x - other.x;
            let oy = this.y - other.y;
            let odist = Math.sqrt(ox*ox + oy*oy);
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
        } else {
            ctx.arc(this.x, this.y, this.radius + (wobble > 0 ? 1 : 0), 0, Math.PI * 2);
        }
        
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#330000';
        ctx.lineWidth = 2;
        ctx.stroke();

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
        
        let angle = Math.atan2(this.y - Game.player.y, this.x - Game.player.x);
        this.pushX += Math.cos(angle) * 100;
        this.pushY += Math.sin(angle) * 100;

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            Game.score++;
            UI.updateScore(Game.score);
            Effects.spawnExplosion(this.x, this.y);
        }
    }
}


