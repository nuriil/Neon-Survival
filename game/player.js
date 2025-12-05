class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 250;
        this.maxHp = 100;
        this.hp = 100;
        
        // Stats
        this.magnetRange = 100;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.level = 1;

        // Weapon
        this.weapon = new WeaponController(this);
    }

    update(dt) {
        let dx = 0;
        let dy = 0;

        if (Game.keys['KeyW'] || Game.keys['ArrowUp']) dy = -1;
        if (Game.keys['KeyS'] || Game.keys['ArrowDown']) dy = 1;
        if (Game.keys['KeyA'] || Game.keys['ArrowLeft']) dx = -1;
        if (Game.keys['KeyD'] || Game.keys['ArrowRight']) dx = 1;

        // Normalize vector (çapraz daha hızlı gitmesin)
        if (dx !== 0 || dy !== 0) {
            let len = Math.sqrt(dx*dx + dy*dy);
            dx /= len;
            dy /= len;
        }

        // Gelecekteki pozisyon
        let nextX = this.x + dx * this.speed * dt;
        let nextY = this.y + dy * this.speed * dt;

        // Harita Sınırları
        this.x = Math.max(this.radius, Math.min(nextX, Game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(nextY, Game.map.height - this.radius));

        // Silah güncelle
        this.weapon.update(dt);
        
        // UI Güncelle
        UI.updateHp(this.hp, this.maxHp);
    }

    draw(ctx) {
        // Karakter Gövdesi (Modern Neon Tarzı)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00d2ff'; // Cyan
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glow (Hale)
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 15;

        // Silah Yönü
        let angle = Math.atan2(Game.mouse.worldY - this.y, Game.mouse.worldX - this.x);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        
        // Silah Çizimi (Dikdörtgen)
        ctx.fillStyle = '#333';
        ctx.fillRect(10, -5, 20, 10); // Namlu
        ctx.fillStyle = '#555';
        ctx.fillRect(0, -5, 10, 10);
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        Effects.spawnBlood(this.x, this.y, '#00d2ff'); // Robot kanı gibi mavi kıvılcım
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