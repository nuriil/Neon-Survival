const EnemySpawner = {
    timer: 0,
    spawnRate: 2.5, 
    
    reset: function() {
        this.timer = 0;
        this.spawnRate = 2.5; 
        Game.enemies = [];
        Game.enemyBullets = [];
        Game.bossMode = false;
    },

    update: function(dt) {
        if (Game.bossMode || Game.isShopOpen) return;

        this.timer -= dt;
        let currentLevel = Game.player ? Game.player.level : 1;
        
        // Her 7 Levelde Bir Boss
        if (currentLevel > 1 && currentLevel % 7 === 0 && !Game.bossMode) {
            this.startBossFight(currentLevel);
            return;
        }

        let targetRate = Math.max(0.3, 2.5 * Math.pow(0.95, currentLevel - 1));
        
        if (this.timer <= 0) {
            this.spawnBatch(currentLevel);
            this.timer = targetRate;
        }
    },

    startBossFight: function(level) {
        Game.bossMode = true;
        // Mevcut düşmanları temizle
        Game.enemies.forEach(e => Effects.spawnExplosion(e.x, e.y));
        Game.enemies = [];
        Game.enemyBullets = [];
        
        UI.showBossWarning(true);

        // Boss Spawn
        let angle = Math.random() * Math.PI * 2;
        let dist = 800;
        let bx = Game.player.x + Math.cos(angle) * dist;
        let by = Game.player.y + Math.sin(angle) * dist;
        
        bx = Math.max(100, Math.min(bx, Game.map.width - 100));
        by = Math.max(100, Math.min(by, Game.map.height - 100));

        Game.enemies.push(new Enemy(bx, by, 'boss', level));
    },

    spawnBatch: function(level) {
        let validPos = false;
        let px, py;
        let safeDist = Game.shop.safeZoneRadius + 150;
        let count = 1 + Math.floor(level / 4);
        count = Math.min(count, 8); 

        for(let i = 0; i < count; i++) {
            validPos = false;
            let attempts = 0;
            while(!validPos && attempts < 15) {
                attempts++;
                let angle = Math.random() * Math.PI * 2;
                let dist = 600 + Math.random() * 300; 
                px = Game.player.x + Math.cos(angle) * dist;
                py = Game.player.y + Math.sin(angle) * dist;
                
                px = Math.max(50, Math.min(px, Game.map.width - 50));
                py = Math.max(50, Math.min(py, Game.map.height - 50));

                let distShop = Math.sqrt((px - Game.shop.x)**2 + (py - Game.shop.y)**2);
                if (distShop > safeDist) validPos = true;
            }

            if (validPos) {
                 Game.enemies.push(new Enemy(px, py, 'zombie', level));
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
        this.level = level;

        this.attackTimer = 0;
        this.attackCooldown = 3.0; 

        let hpMulti = 1 + (level * 0.15); 
        let speedMulti = 1 + (level * 0.02);

        if (type === 'boss') {
            this.radius = 80; 
            this.speed = 110 * speedMulti;
            this.hp = 3000 * hpMulti; 
            this.maxHp = this.hp;
            this.color = '#8800ff'; 
            this.damage = 40 + level;
        } else {
            this.radius = 16;
            this.speed = (100 + Math.random() * 40) * speedMulti;
            this.hp = 60 * hpMulti; 
            this.maxHp = this.hp;
            this.color = '#ff5555';
            this.damage = 1 + Math.floor(level * 0.5);
        }
    }

    update(dt) {
        // Safe Zone İtme (Normal zamanda)
        if (!Game.bossMode) {
            let distToShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
            if (distToShop < Game.shop.safeZoneRadius) {
                let angle = Math.atan2(this.y - Game.shop.y, this.x - Game.shop.x);
                this.x += Math.cos(angle) * 300 * dt;
                this.y += Math.sin(angle) * 300 * dt;
            }
        }

        let playerInSafeZone = false;
        if (!Game.bossMode) {
            playerInSafeZone = Math.sqrt((Game.player.x - Game.shop.x)**2 + (Game.player.y - Game.shop.y)**2) < Game.shop.safeZoneRadius;
        }
        
        let targetX, targetY;

        if (playerInSafeZone) {
            let wanderAngle = Date.now() / 500 + this.x;
            targetX = this.x + Math.cos(wanderAngle) * 50;
            targetY = this.y + Math.sin(wanderAngle) * 50;
        } else {
            let target = Game.player;
            let minDist = Math.sqrt((this.x - Game.player.x)**2 + (this.y - Game.player.y)**2);

            if (!Game.bossMode) {
                for(let bot of Game.bots) {
                    let d = Math.sqrt((this.x - bot.x)**2 + (this.y - bot.y)**2);
                    if (d < minDist) {
                        minDist = d;
                        target = bot;
                    }
                }
            }
            targetX = target.x;
            targetY = target.y;
        }

        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }

        // Birbirini itme
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

        if (this.type === 'boss' && !playerInSafeZone) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.shootProjectile();
                this.attackTimer = this.attackCooldown;
            }
        }

        this.x += (dx * this.speed + this.pushX) * dt;
        this.y += (dy * this.speed + this.pushY) * dt;

        // HARİTA SINIRLARI KONTROLÜ (YENİ EKLENDİ - Dışarı çıkamazlar)
        this.x = Math.max(this.radius, Math.min(this.x, Game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, Game.map.height - this.radius));
    }

    shootProjectile() {
        let angle = Math.atan2(Game.player.y - this.y, Game.player.x - this.x);
        let speed = 400; 
        let damage = this.damage * 1.5;
        Game.enemyBullets.push(new EnemyBullet(this.x, this.y, angle, speed, damage));
    }

    draw(ctx) {
        ctx.beginPath();
        let wobble = Math.sin(Date.now() / 100) * 2;
        
        if (this.type === 'boss') {
            ctx.fillStyle = this.color;
            for(let i=0; i<8; i++) {
                let a = (Date.now()/500) + (i * Math.PI * 2) / 8;
                let rx = this.x + Math.cos(a) * (this.radius + 10);
                let ry = this.y + Math.sin(a) * (this.radius + 10);
                ctx.beginPath();
                ctx.arc(rx, ry, 15, 0, Math.PI*2);
                ctx.fill();
            }
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            let hpPct = this.hp / this.maxHp;
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x - 50, this.y - 100, 100, 10);
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 50, this.y - 100, 100 * hpPct, 10);

        } else {
            ctx.arc(this.x, this.y, this.radius + (wobble > 0 ? 1 : 0), 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        ctx.strokeStyle = '#330000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x - this.radius/3, this.y - 5, 3, 0, Math.PI*2);
        ctx.arc(this.x + this.radius/3, this.y - 5, 3, 0, Math.PI*2);
        ctx.fill();
    }

    takeDamage(amount) {
        this.hp -= amount;
        Effects.spawnBlood(this.x, this.y, '#880000');
        Effects.showDamage(this.x, this.y - 20, Math.floor(amount));
        
        let angle = Math.atan2(this.y - Game.player.y, this.x - Game.player.x);
        this.pushX += Math.cos(angle) * 150;
        this.pushY += Math.sin(angle) * 150;

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            Game.score += (this.type === 'boss' ? 500 : 1);
            UI.updateScore(Game.score);
            Effects.spawnExplosion(this.x, this.y);
        }
    }
}

class EnemyBullet {
    constructor(x, y, angle, speed, damage) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.radius = 15; 
        this.life = 3.0;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = '#ff4400';
        ctx.fill();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
