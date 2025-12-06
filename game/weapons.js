// Silah Konfigürasyonları
const WEAPONS = [
    {
        name: 'PISTOL',
        fireRate: 0.4,       // Saniyede ateş hızı
        damage: 10,
        speed: 800,
        count: 1,            // Mermi sayısı
        spread: 0.05,        // Dağılma açısı (radyan)
        color: '#ffff00',
        pierce: 1            // Kaç düşmanı deler
    },
    {
        name: 'MACHINE GUN',
        fireRate: 0.1,       // Çok hızlı
        damage: 12,
        speed: 900,
        count: 1,
        spread: 0.15,        // Biraz dağılır
        color: '#00ff00',
        pierce: 1
    },
    {
        name: 'SHOTGUN',
        fireRate: 2.0,       // Yavaş
        damage: 14,
        speed: 700,
        count: 4,            // 6 mermi atar
        spread: 0.5,         // Geniş dağılım
        color: '#ffaa00',
        pierce: 2            // 2 kişiyi deler
    },
    {
        name: 'SNIPER',
        fireRate: 2.2,       // Çok yavaş
        damage: 150,         // Çok yüksek hasar
        speed: 1500,         // Çok hızlı mermi
        count: 1,
        spread: 0.0,         // Sıfır hata payı
        color: '#00d2ff',
        pierce: 10           // Her şeyi deler geçer
    }
];

class WeaponController {
    constructor(owner) {
        this.owner = owner;
        this.timer = 0;
        this.currentWeaponIndex = 0; // Pistol ile başla
        this.activeWeapon = WEAPONS[this.currentWeaponIndex];
        
        // Upgrade çarpanları
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
            this.timer = 0.5; // Değiştirince hemen ateş edemesin (küçük bir gecikme)
            
            // UI Güncelle
            const uiName = document.getElementById('weapon-name');
            if(uiName) uiName.innerText = this.activeWeapon.name;
        }
    }

    update(dt) {
        this.timer -= dt;

        // Mouse Basılı mı?
        if (Game.mouse.down && this.timer <= 0) {
            this.shoot();
            // Ateş hızı hesaplama (Upgrade çarpanları dahil)
            this.timer = this.activeWeapon.fireRate * this.modifiers.fireRate;
        }
    }

    shoot() {
        // Hedef: Mouse'un Dünya Koordinatları
        // atan2(y2-y1, x2-x1)
        let targetAngle = Math.atan2(
            Game.mouse.worldY - this.owner.y, 
            Game.mouse.worldX - this.owner.x
        );
        
        let bulletCount = this.activeWeapon.count + this.modifiers.count;

        for(let i=0; i<bulletCount; i++) {
            // Spread (Dağılma) Hesabı
            // Eğer tek mermi ise spread'i rastgele sağa sola ver
            // Çoklu mermiyse yelpaze şeklinde aç
            let spreadOffset;
            
            if (bulletCount === 1) {
                spreadOffset = (Math.random() - 0.5) * this.activeWeapon.spread;
            } else {
                // Shotgun mantığı: Yelpaze
                spreadOffset = (i - (bulletCount-1)/2) * (this.activeWeapon.spread / bulletCount);
                // Hafif rastgelelik de ekle
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
        this.pierce = pierce || 1; // Kaç düşmanı delip geçebilir
        
        this.radius = 6;
        this.markedForDeletion = false;
        this.life = 1.5; // Ömür
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
        
        // Kuyruk efekti
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

}

