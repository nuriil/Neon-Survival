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
        
        // Regen Loop
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

        this.x = Math.max(this.radius, Math.min(nextX, Game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(nextY, Game.map.height - this.radius));

        // Safe Zone Kontrolü: İçerdeyken ateş edemez
        let distShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        let inSafeZone = distShop < Game.shop.safeZoneRadius;
        
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

        // Silah
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
        if (distToShop < Game.shop.safeZoneRadius) return; // Güvenli bölgede hasar almaz

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
        UI.showUpgradeMenu(false); // Normal Level Up
    }
}

// YARDIMCI BOT SINIFI
class Bot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 260; // Oyuncudan bir tık hızlı ki yetişsin
        // Silah kontrolcüsü, sahibinin (player) değil kendisinin (bot) koordinatlarını kullanmalı.
        // Ancak WeaponController 'owner' alıyor. Botu owner olarak vereceğiz.
        this.weapon = new WeaponController(this);
        this.weapon.activeWeapon = Game.player.weapon.activeWeapon; // Oyuncunun silahını kopyala
        
        // Botun hedefi
        this.targetEnemy = null;
    }

    update(dt) {
        // 1. Silah Senkronizasyonu (Oyuncu değiştirirse bot da değiştirsin)
        // Ancak modifiyeler vs. uğraştırıcı, direkt referansı kopyalayalım.
        if (this.weapon.activeWeapon.name !== Game.player.weapon.activeWeapon.name) {
             this.weapon.activeWeapon = Game.player.weapon.activeWeapon;
        }
        // Stat kopyalama (Basitçe)
        this.weapon.modifiers = Game.player.weapon.modifiers;

        // 2. Hareket Mantığı (Oyuncuyu takip et ama düşmana yaklaş)
        let distToPlayer = Math.sqrt((this.x - Game.player.x)**2 + (this.y - Game.player.y)**2);
        
        // En yakın düşmanı bul
        let closestEnemy = null;
        let minDist = 600; // Görüş menzili

        Game.enemies.forEach(e => {
            let d = Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2);
            if (d < minDist) {
                minDist = d;
                closestEnemy = e;
            }
        });
        
        this.targetEnemy = closestEnemy;

        let moveX = 0, moveY = 0;

        if (distToPlayer > 300) {
            // Oyuncudan çok uzaksa oyuncuya koş
            moveX = Game.player.x - this.x;
            moveY = Game.player.y - this.y;
        } else if (closestEnemy) {
            // Düşman varsa ve oyuncuya yakınsam, düşmandan menzil koru ama ateş et
            // Kiting mantığı: Çok yakınsa kaç, uzaksa yaklaş
            let distToEnemy = Math.sqrt((this.x - closestEnemy.x)**2 + (this.y - closestEnemy.y)**2);
            if (distToEnemy < 150) {
                moveX = this.x - closestEnemy.x; // Kaç
                moveY = this.y - closestEnemy.y;
            } else {
                // Pozisyon koru, etrafında dön veya hafif yaklaş
                // Basitlik için: Olduğu yerde dursun ateş etsin
                moveX = 0;
                moveY = 0;
            }
        } else {
            // Düşman yok, oyuncuya yapış
            if (distToPlayer > 80) {
                moveX = Game.player.x - this.x;
                moveY = Game.player.y - this.y;
            }
        }

        // Hareketi uygula
        if (moveX !== 0 || moveY !== 0) {
            let len = Math.sqrt(moveX*moveX + moveY*moveY);
            moveX /= len;
            moveY /= len;
            this.x += moveX * this.speed * dt;
            this.y += moveY * this.speed * dt;
        }

        // Sınırlar
        this.x = Math.max(this.radius, Math.min(this.x, Game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, Game.map.height - this.radius));

        // 3. Ateş Etme
        if (this.targetEnemy) {
            // WeaponController Game.mouse'a göre ateş ediyor. 
            // Bot için WeaponController'ı hacklememiz lazım veya manuel ateşlemeliyiz.
            // WeaponController'ı Bot için özelleştirmedik, o yüzden manuel ateşleyelim:
            this.weapon.timer -= dt;
            if (this.weapon.timer <= 0) {
                 this.botShoot(this.targetEnemy);
                 this.weapon.timer = this.weapon.activeWeapon.fireRate * (this.weapon.modifiers.fireRate || 1);
            }
        }
    }

    // Bot için özel shoot fonksiyonu (WeaponController'dan türetilmiş mantık)
    botShoot(target) {
        // Nişan alma (Hafif sapma ekleyelim, çok robotik olmasın)
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
        // Oyuncunun aynısı ama hafif şeffaf veya "BOT" yazısı var
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        
        // Oyuncunun rengini al
        let color = Game.player.currentSkin ? Game.player.currentSkin.color : '#00d2ff';
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // Bot Yazısı
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("BOT", this.x, this.y - 25);

        // Silah
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
