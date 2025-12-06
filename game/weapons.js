// Silah Konfigürasyonları
const WEAPONS = [
    {
        name: 'PISTOL',
        fireRate: 0.4,       
        damage: 25,          // 75 HP Zombi -> 3 vuruş
        speed: 800,
        count: 1,            
        spread: 0.05,        
        color: '#ffff00',
        pierce: 1            
    },
    {
        name: 'MACHINE GUN',
        fireRate: 0.12,      // Biraz yavaşlattık denge için
        damage: 15,          // 75 HP -> 5 vuruş (Seri atıyor)
        speed: 900,
        count: 1,
        spread: 0.15,        
        color: '#00ff00',
        pierce: 1
    },
    {
        name: 'SHOTGUN',
        fireRate: 1.0,       
        damage: 15,          // Pellet başına 15. 6 pellet = 90 dmg (Tek atar yakından)
        speed: 700,
        count: 6,            
        spread: 0.5,         
        color: '#ffaa00',
        pierce: 2            
    },
    {
        name: 'SNIPER',
        fireRate: 1.5,       
        damage: 200,         // Kesin tek atar
        speed: 1500,         
        count: 1,
        spread: 0.0,         
        color: '#00d2ff',
        pierce: 10           
    }
];

class WeaponController {
    constructor(owner) {
        this.owner = owner;
        this.timer = 0;
        this.currentWeaponIndex = 0; 
        this.activeWeapon = WEAPONS[this.currentWeaponIndex];
        
        this.modifiers = {
            damage: 1.0,
            fireRate: 1.0,
            count: 0
        };
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
        
        // Market açıkken ateş edemesin
        if (Game.isShopOpen) return;

        if (Game.mouse.down && this.timer <= 0) {
            this.shoot();
            this.timer = this.activeWeapon.fireRate * this.modifiers.fireRate;
        }
    }

    shoot() {
        let targetAngle = Math.atan2(
            Game.mouse.worldY - this.owner.y, 
            Game.mouse.worldX - this.owner.x
        );
        
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

            Game.bullets.push(new Bullet(
                this.owner.x, 
                this.owner.y, 
                finalAngle, 
                this.activeWeapon.speed, 
                this.activeWeapon.damage * this.modifiers.damage,
                this.activeWeapon.color,
                this.activeWeapon.pierce
            ));
        }
    }
}

class Bullet {
    constructor(x, y, angle, speed, damage, color, pierce) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.color = color;
        this.pierce = pierce || 1; 
        
        this.radius = 6;
        this.markedForDeletion = false;
        this.life = 1.5; 
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        
        if (this.life <= 0 || 
            this.x < 0 || this.x > Game.map.width || 
            this.y < 0 || this.y > Game.map.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
