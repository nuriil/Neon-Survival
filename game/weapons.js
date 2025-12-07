const WEAPONS = [
    { name: 'PISTOL', price: 0, fireRate: 0.4, damage: 25, speed: 800, count: 1, spread: 0.05, color: '#ffff00', pierce: 1 },
    { name: 'MACHINE GUN', price: 1500, fireRate: 0.12, damage: 15, speed: 900, count: 1, spread: 0.15, color: '#00ff00', pierce: 1 },
    { name: 'SHOTGUN', price: 3000, fireRate: 1.0, damage: 15, speed: 700, count: 6, spread: 0.5, color: '#ffaa00', pierce: 2 },
    { name: 'SNIPER', price: 6000, fireRate: 1.5, damage: 200, speed: 1500, count: 1, spread: 0.0, color: '#00d2ff', pierce: 10 }
];

class WeaponController {
    constructor(owner) {
        this.owner = owner;
        this.timer = 0;
        this.currentWeaponIndex = 0; 
        this.canShoot = true; 
        
        let initialIndex = (owner.ownedWeapons && owner.ownedWeapons.length > 0) ? owner.ownedWeapons[0] : 0;
        if (WEAPONS && WEAPONS.length > 0) {
             this.currentWeaponIndex = initialIndex;
             this.activeWeapon = WEAPONS[this.currentWeaponIndex];
        } else {
             this.activeWeapon = { name: 'ERROR', fireRate: 1, damage: 10, speed: 500, count: 1, spread: 0, color: '#fff', pierce: 1 };
        }
        
        this.modifiers = { damage: 1.0, fireRate: 1.0, count: 0, speed: 1.0, pierce: 0 };
    }

    switchWeapon(index) {
        if (index >= 0 && index < WEAPONS.length) {
            this.currentWeaponIndex = index;
            this.activeWeapon = WEAPONS[index];
            this.timer = 0.5; 
            const uiName = document.getElementById('weapon-name');
            if(uiName) uiName.innerText = this.activeWeapon.name;
        }
    }

    update(dt) {
        this.timer -= dt;
        if (Game.isShopOpen || !this.canShoot) return;

        if (this.owner === Game.player && Game.mouse.down && this.timer <= 0) {
            this.shoot();
            this.timer = this.activeWeapon.fireRate * this.modifiers.fireRate;
        }
    }

    shoot() {
        if(!this.activeWeapon) return;

        let targetAngle = Math.atan2(Game.mouse.worldY - this.owner.y, Game.mouse.worldX - this.owner.x);
        let bulletCount = this.activeWeapon.count + this.modifiers.count;

        for(let i=0; i<bulletCount; i++) {
            let spreadOffset;
            if (bulletCount === 1) {
                spreadOffset = (Math.random() - 0.5) * this.activeWeapon.spread;
            } else {
                spreadOffset = (i - (bulletCount-1)/2) * (this.activeWeapon.spread / bulletCount);
                spreadOffset += (Math.random() - 0.5) * 0.05;
            }

            let finalAngle = targetAngle + spreadOffset;
            let finalSpeed = this.activeWeapon.speed * (this.modifiers.speed || 1);
            let finalPierce = (this.activeWeapon.pierce || 1) + (this.modifiers.pierce || 0);

            Game.bullets.push(new Bullet(
                this.owner.x, 
                this.owner.y, 
                finalAngle, 
                finalSpeed, 
                this.activeWeapon.damage * this.modifiers.damage,
                this.activeWeapon.color,
                finalPierce
            ));
        }
    }
}

class Bullet {
    constructor(x, y, angle, speed, damage, color, pierce) {
        this.x = x; this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.color = color;
        this.pierce = pierce; 
        this.radius = 6;
        this.markedForDeletion = false;
        this.life = 2.0; 
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0 || this.x < 0 || this.x > Game.map.width || this.y < 0 || this.y > Game.map.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
        ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.stroke();
    }
}
