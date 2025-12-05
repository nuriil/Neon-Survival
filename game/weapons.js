class WeaponController {
    constructor(owner) {
        this.owner = owner;
        this.fireRate = 0.2; // Saniyede ateşleme hızı
        this.timer = 0;
        this.damage = 20;
        this.bulletSpeed = 800;
        this.bulletCount = 1; // Multishot için
    }

    update(dt) {
        this.timer -= dt;
        // Otomatik ateş veya tıklama ile ateş
        // Mobil uyumu için otomatik ateş en iyisidir
        if (this.timer <= 0 && Game.enemies.length > 0) {
            // En yakın düşmanı bul
            let nearest = this.getNearestEnemy();
            if (nearest) {
                this.shoot(nearest);
                this.timer = this.fireRate;
            }
        }
    }

    getNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        Game.enemies.forEach(e => {
            let d = (e.x - this.owner.x)**2 + (e.y - this.owner.y)**2;
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        });
        // Sadece ekrandakilere veya 600px yakındakilere ateş et
        if (minDist < 600**2) return nearest;
        return null;
    }

    shoot(target) {
        // Hedefe açı hesapla
        let angle = Math.atan2(target.y - this.owner.y, target.x - this.owner.x);
        
        // Çoklu mermi (Multishot)
        for(let i=0; i<this.bulletCount; i++) {
            // Hafif yayılma (spread) ekle
            let spread = (i - (this.bulletCount-1)/2) * 0.1; 
            Game.bullets.push(new Bullet(
                this.owner.x, 
                this.owner.y, 
                angle + spread, 
                this.bulletSpeed, 
                this.damage
            ));
        }
        
        // Ateş sesi efekti (Buraya eklenebilir)
    }
}

class Bullet {
    constructor(x, y, angle, speed, damage) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.radius = 6;
        this.markedForDeletion = false;
        this.life = 2.0; // 2 saniye sonra yok olur
        this.color = '#ffff00';
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
        ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}