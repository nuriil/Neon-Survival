class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        
        // --- TEMEL DEĞERLER (Değişmez Referanslar) ---
        this.baseStats = {
            speed: 250,
            maxHp: 100,
            magnetRange: 100,
            armor: 0
        };

        // --- GÜNCEL DEĞERLER ---
        this.speed = this.baseStats.speed;
        this.maxHp = this.baseStats.maxHp;
        this.hp = this.maxHp;
        this.magnetRange = this.baseStats.magnetRange;
        this.armor = this.baseStats.armor;
        
        // --- EKONOMİ VE GELİŞİM ---
        this.coins = 0;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.level = 1;

        // --- ENVANTER ---
        this.currentSkin = { id: 'default', color: '#00d2ff', shape: 'circle', bonuses: {} };
        this.ownedSkins = ['default']; 
        this.ownedWeapons = [0]; 

        // Weapon Controller
        this.weapon = new WeaponController(this);
        
        // Başlangıçta varsayılan kostüm özelliklerini uygula (varsa)
        this.applySkinStats();
    }

    update(dt) {
        let dx = 0;
        let dy = 0;

        if (!Game.isPaused) {
            if (Game.keys['KeyW'] || Game.keys['ArrowUp']) dy = -1;
            if (Game.keys['KeyS'] || Game.keys['ArrowDown']) dy = 1;
            if (Game.keys['KeyA'] || Game.keys['ArrowLeft']) dx = -1;
            if (Game.keys['KeyD'] || Game.keys['ArrowRight']) dx = 1;
        }

        if (dx !== 0 || dy !== 0) {
            let len = Math.sqrt(dx*dx + dy*dy);
            dx /= len;
            dy /= len;
        }

        let nextX = this.x + dx * this.speed * dt;
        let nextY = this.y + dy * this.speed * dt;

        this.x = Math.max(this.radius, Math.min(nextX, Game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(nextY, Game.map.height - this.radius));

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
        
        ctx.fillStyle = color; 
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Silah yönü
        let angle = Math.atan2(Game.mouse.worldY - this.y, Game.mouse.worldX - this.x);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#333';
        ctx.fillRect(10, -5, 25, 10);
        ctx.fillStyle = '#777';
        ctx.fillRect(0, -5, 10, 10);
        ctx.restore();
        ctx.shadowBlur = 0;
    }

    takeDamage(amount) {
        let distToShop = Math.sqrt((this.x - Game.shop.x)**2 + (this.y - Game.shop.y)**2);
        if (distToShop < Game.shop.safeZoneRadius) return;

        let reducedAmount = amount * (1 - this.armor);
        this.hp -= reducedAmount;
        
        let bloodColor = this.currentSkin ? this.currentSkin.color : '#ff0000';
        Effects.spawnBlood(this.x, this.y, bloodColor);
        
        if (this.hp <= 0) {
            UI.showGameOver();
            Game.isRunning = false;
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.nextLevelXp) {
            this.levelUp();
        }
        UI.updateXp(this.xp, this.nextLevelXp);
    }

    gainCoins(amount) {
        this.coins += amount;
        UI.updateCoins(this.coins);
        Effects.showDamage(this.x, this.y - 30, "+" + amount + " G", "#FFD700");
    }

    // --- KOSTÜM SİSTEMİ ---
    setSkin(skinData) {
        this.currentSkin = {
            id: skinData.id,
            color: skinData.color,
            shape: skinData.shape,
            bonuses: skinData.bonuses || {}
        };
        // Kostüm değişince statları sıfırla ve yeniden hesapla
        this.resetLevelStats(); 
    }

    // --- SİLAH SİSTEMİ ---
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

    // --- STAT YÖNETİMİ ---

    // 1. Adım: Her şeyi sıfırla ve Kostüm Bonuslarını Ekle
    applySkinStats() {
        // Önce karaketeri fabrika ayarlarına (BaseStats) döndür
        this.speed = this.baseStats.speed;
        this.maxHp = this.baseStats.maxHp;
        this.magnetRange = this.baseStats.magnetRange;
        this.armor = this.baseStats.armor;

        // Silah modifierlarını sıfırla
        this.weapon.modifiers = {
            damage: 1.0,
            fireRate: 1.0,
            count: 0,
            speed: 1.0,
            pierce: 0
        };

        // Kostüm bonuslarını üzerine ekle
        const b = this.currentSkin.bonuses;
        if (b) {
            if (b.speed) this.speed *= b.speed;
            if (b.maxHp) this.maxHp += b.maxHp; // HP üzerine eklenir
            if (b.armor) this.armor += b.armor;
            if (b.damage) this.weapon.modifiers.damage *= b.damage;
            if (b.fireRate) this.weapon.modifiers.fireRate *= b.fireRate; // Dikkat: fireRate modifier küçülürse hızlanır, büyürse yavaşlar mı? Logic: fireRate modifier genellikle çarpan olur. Hız artışı için Weapons.js'de cooldown = rate / modifier kullanıyoruz. Yani modifier > 1 ise hızlanır.
        }
        
        // Can barını güncelle (Max HP artmış olabilir)
        this.hp = Math.min(this.hp, this.maxHp);
    }

    // 2. Adım: Level atlandığında bu çağrılır.
    resetLevelStats() {
        // Eski geçici upgradeleri silmek için base+skin haline geri dönüyoruz.
        this.applySkinStats();
        // UI'ya haber ver
        UI.updateHp(this.hp, this.maxHp);
        Effects.showDamage(this.x, this.y - 50, "STATLAR SIFIRLANDI", "#aaa");
    }

    levelUp() {
        this.level++;
        this.xp -= this.nextLevelXp;
        // Level atlama zorluğu
        this.nextLevelXp = Math.floor(this.nextLevelXp * 1.3);
        
        // ÖNEMLİ: Level bittiği için önceki levelın upgrade'ini SİL.
        this.resetLevelStats();
        
        // Level atlama ödülü olarak canı fulle
        this.hp = this.maxHp; 
        
        UI.updateLevel(this.level);
        UI.showUpgradeMenu();
    }
}
