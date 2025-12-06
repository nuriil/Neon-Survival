class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 250;
        this.maxHp = 100;
        this.hp = 100;
        
        // --- EKONOMİ VE KOSTÜM SİSTEMİ ---
        this.coins = 0;
        this.magnetRange = 100;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.level = 1;

        // Bu kısım EKSİK ise Market açılmaz!
        this.currentSkin = { id: 'default', color: '#00d2ff', shape: 'circle' };
        this.ownedSkins = ['default']; 

        // Weapon
        this.weapon = new WeaponController(this);
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
        
        // Kostüm şekline göre çizim
        if (this.currentSkin && this.currentSkin.shape === 'square') {
            let s = this.radius * 2;
            ctx.rect(this.x - this.radius, this.y - this.radius, s, s);
        } else {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        }

        // Kostüm rengi kontrolü (Hata önleyici)
        let color = this.currentSkin ? this.currentSkin.color : '#00d2ff';
        
        ctx.fillStyle = color; 
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

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

        this.hp -= amount;
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

    setSkin(skinData) {
        this.currentSkin = {
            id: skinData.id,
            color: skinData.color,
            shape: skinData.shape
        };
    }

    levelUp() {
        this.level++;
        this.xp -= this.nextLevelXp;
        this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
        this.maxHp += 10;
        this.hp = this.maxHp;
        
        UI.updateLevel(this.level);
        UI.showUpgradeMenu();
    }
}
