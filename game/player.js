class Player {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 20;
        
        this.baseStats = { speed: 250, maxHp: 100, magnetRange: 100, armor: 0, regen: 0 };
        this.speed = this.baseStats.speed;
        this.maxHp = this.baseStats.maxHp;
        this.hp = this.maxHp;
        this.magnetRange = this.baseStats.magnetRange;
        this.armor = this.baseStats.armor;
        this.regen = 0;

        this.coins = 0;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.level = 1;

        this.currentSkin = { id: 'default', color: '#00d2ff', shape: 'circle', bonuses: {} };
        this.ownedSkins = ['default']; 
        this.ownedWeapons = [0]; 

        this.weapon = new WeaponController(this);
        this.applySkinStats();
        
        setInterval(() => {
            if (this.hp < this.maxHp && this.regen > 0 && !Game.isPaused) {
                this.hp = Math.min(this.maxHp, this.hp + this.regen);
                UI.updateHp(this.hp, this.maxHp);
            }
        }, 1000);
    }

    update(dt) {
        let dx = 0; let dy = 0;
        if (!Game.isPaused) {
            if (Game.keys['KeyW'] || Game.keys['ArrowUp']) dy = -1;
            if (Game.keys['KeyS'] || Game.keys['ArrowDown']) dy = 1;
            if (Game.keys['KeyA'] || Game.keys['ArrowLeft']) dx = -1;
            if (Game.keys['KeyD'] || Game.keys['ArrowRight']) dx = 1;
        }

        if (dx !== 0 || dy !== 0) {
            let len = Math.sqrt(dx*dx + dy*dy);
            dx /= len; dy /= len;
        }

        let nextX = this.x + dx * this.speed * dt;
        let nextY = this.y + dy * this.speed * dt;
        
        // BOSS MODUNDA SAFE ZONE GİRİŞİ YASAK
        if (Game.bossMode) {
             let distToShop = Math.sqrt((nextX - Game.shop.x)**2 + (nextY - Game.shop.y)**2);
             // SafeZoneRadius'dan biraz daha büyük alalım ki sınıra yapışsın
             let limit = Game.shop.safeZoneRadius + this.radius;
             if (distToShop < limit) {
                 // İçeri girmeye çalışıyor, engelle
                 // Basit çözüm: Eski pozisyonunda kalsın veya geri itilsin
                 // Vektör matematiği ile sınırda kaymasını sağlayalım
                 let angle = Math.atan2(nextY - Game.shop.y, nextX - Game.shop.x);
                 nextX = Game.shop.x + Math.cos(angle) * limit;
                 nextY = Game.shop.y + Math.sin(angle) * limit;
             }
        }

        this.x = Math.max(this.radius, Math.min(nextX, Game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(nextY, Game.map.height - this.radius));

        let distShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        let inSafeZone = distShop < Game.shop.safeZoneRadius;
        
        // Eğer boss modundaysak safe zone zaten yasak, ama yine de kontrol edelim
        this.weapon.canShoot = !inSafeZone;
        this.weapon.update(dt);
        
        UI.updateHp(this.hp, this.maxHp);
    }

    draw(ctx) {
        ctx.beginPath();
        if (this.currentSkin && this.currentSkin.shape === 'square') {
            let s = this.radius * 2;
            ctx.rect(this.x - this.radius, this.y - this.radius, s, s);
        } else {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        }

        let color = this.currentSkin ? this.currentSkin.color : '#00d2ff';
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowColor = color; ctx.shadowBlur = 15;

        let angle = Math.atan2(Game.mouse.worldY - this.y, Game.mouse.worldX - this.x);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#333'; ctx.fillRect(10, -5, 25, 10);
        ctx.fillStyle = '#777'; ctx.fillRect(0, -5, 10, 10);
        ctx.restore();
        ctx.shadowBlur = 0;
    }

    takeDamage(amount) {
        let distToShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        if (distToShop < Game.shop.safeZoneRadius && !Game.bossMode) return; 

        let reducedAmount = amount * (1 - this.armor);
        this.hp -= reducedAmount;
        Effects.spawnBlood(this.x, this.y, this.currentSkin.color);
        
        if (this.hp <= 0) {
            UI.showGameOver();
            Game.isRunning = false;
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.nextLevelXp) this.levelUp();
        UI.updateXp(this.xp, this.nextLevelXp);
    }

    gainCoins(amount) {
        this.coins += amount;
        UI.updateCoins(this.coins);
        Effects.showDamage(this.x, this.y - 30, "+" + amount + " G", "#FFD700");
    }

    setSkin(skinData) {
        this.currentSkin = { id: skinData.id, color: skinData.color, shape: skinData.shape, bonuses: skinData.bonuses || {} };
        this.resetLevelStats(); 
    }

    buyWeapon(index, price) {
        if (this.ownedWeapons.includes(index)) {
            this.weapon.switchWeapon(index);
            return true;
        }
        if (this.coins >= price) {
            this.coins -= price;
            this.ownedWeapons.push(index);
            this.weapon.switchWeapon(index);
            UI.updateCoins(this.coins);
            Effects.showDamage(this.x, this.y, "SİLAH ALINDI!", "#00ff00");
            return true;
        }
        return false;
    }

    applySkinStats() {
        this.speed = this.baseStats.speed;
        this.maxHp = this.baseStats.maxHp;
        this.magnetRange = this.baseStats.magnetRange;
        this.armor = this.baseStats.armor;
        this.regen = this.baseStats.regen || 0;

        this.weapon.modifiers = { damage: 1.0, fireRate: 1.0, count: 0, speed: 1.0, pierce: 0 };

        const b = this.currentSkin.bonuses;
        if (b) {
            if (b.speed) this.speed *= b.speed;
            if (b.maxHp) this.maxHp += b.maxHp; 
            if (b.armor) this.armor += b.armor;
            if (b.damage) this.weapon.modifiers.damage *= b.damage;
            if (b.fireRate) this.weapon.modifiers.fireRate *= b.fireRate;
        }
        this.hp = Math.min(this.hp, this.maxHp);
    }

    resetLevelStats() {
        this.applySkinStats();
        UI.updateHp(this.hp, this.maxHp);
        Effects.showDamage(this.x, this.y - 50, "STATLAR SIFIRLANDI", "#aaa");
    }

    levelUp() {
        this.level++;
        this.xp -= this.nextLevelXp;
        this.nextLevelXp = Math.floor(this.nextLevelXp * 1.3);
        this.resetLevelStats();
        this.hp = this.maxHp; 
        UI.updateLevel(this.level);
        UI.showUpgradeMenu();
    }
}

class Bot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 280; // Oyuncudan hızlı
        this.weapon = new WeaponController(this);
        this.weapon.activeWeapon = Game.player.weapon.activeWeapon; 
        this.targetEnemy = null;
    }

    update(dt) {
        if (this.weapon.activeWeapon.name !== Game.player.weapon.activeWeapon.name) {
             this.weapon.activeWeapon = Game.player.weapon.activeWeapon;
        }
        this.weapon.modifiers = Game.player.weapon.modifiers;

        // BOT HAREKET MANTIĞI: OYUNCUYA YAPIŞIK
        let distToPlayer = Math.sqrt((this.x - Game.player.x)**2 + (this.y - Game.player.y)**2);
        
        let moveX = 0, moveY = 0;

        // "Uzak kalmasın çok dibime de girmesin"
        // 50 ile 120 birim mesafe iyidir.
        if (distToPlayer > 120) {
            // Çok uzak, yaklaş
            moveX = Game.player.x - this.x;
            moveY = Game.player.y - this.y;
        } else if (distToPlayer < 50) {
            // Çok yakın, azıcık uzaklaş
            moveX = this.x - Game.player.x;
            moveY = this.y - Game.player.y;
        } else {
            // Mesafe ideal, oyuncu hareket ediyorsa ona uy
            // Burada ek bir şey yapmaya gerek yok, üstteki bloklar halleder.
        }

        // Hareketi uygula
        if (moveX !== 0 || moveY !== 0) {
            let len = Math.sqrt(moveX*moveX + moveY*moveY);
            moveX /= len;
            moveY /= len;
            this.x += moveX * this.speed * dt;
            this.y += moveY * this.speed * dt;
        }

        this.x = Math.max(this.radius, Math.min(this.x, Game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, Game.map.height - this.radius));

        // BOT ATEŞ MANTIĞI
        // Safe Zone kontrolü
        let distShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        let inSafeZone = distShop < Game.shop.safeZoneRadius;

        if (!inSafeZone) {
            // En yakın düşmanı bul
            let closestEnemy = null;
            let minDist = 700; 

            Game.enemies.forEach(e => {
                let d = Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2);
                if (d < minDist) {
                    minDist = d;
                    closestEnemy = e;
                }
            });

            this.targetEnemy = closestEnemy;

            if (this.targetEnemy) {
                this.weapon.timer -= dt;
                if (this.weapon.timer <= 0) {
                    this.botShoot(this.targetEnemy);
                    this.weapon.timer = this.weapon.activeWeapon.fireRate * (this.weapon.modifiers.fireRate || 1);
                }
            }
        } else {
            this.targetEnemy = null; // Ateş etme
        }
    }

    botShoot(target) {
        let angle = Math.atan2(target.y - this.y, target.x - this.x);
        angle += (Math.random() - 0.5) * 0.1;

        let w = this.weapon.activeWeapon;
        let m = this.weapon.modifiers;
        
        let damage = w.damage * m.damage;
        let speed = w.speed * (m.speed || 1);
        let pierce = (w.pierce || 1) + (m.pierce || 0);
        let count = w.count + m.count;

        for(let i=0; i<count; i++) {
             let spread = (i - (count-1)/2) * 0.1; 
             Game.bullets.push(new Bullet(this.x, this.y, angle + spread, speed, damage, w.color, pierce));
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        let color = Game.player.currentSkin ? Game.player.currentSkin.color : '#00d2ff';
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("BOT", this.x, this.y - 25);

        if (this.targetEnemy) {
            let angle = Math.atan2(this.targetEnemy.y - this.y, this.targetEnemy.x - this.x);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.fillStyle = '#333'; ctx.fillRect(10, -5, 25, 10);
            ctx.restore();
        }
    }
}
