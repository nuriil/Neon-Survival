const EnemySpawner = {
    timer: 0,
    spawnRate: 1.0, // BAŞLANGIÇ: 1.0 yerine 2.0 saniye yaptık (Daha yavaş başlasın)
    difficultyMultiplier: 1.0,

    reset: function() {
        this.timer = 0;
        this.spawnRate = 2.0; 
        Game.enemies = [];
    },

    update: function(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.spawnBatch();
            this.timer = this.spawnRate;
            
            // DÜZENLEME: Zorluk artışını yavaşlattık.
            // Eskiden 500 skorda en zor seviyeye geliyordu, şimdi 1000 skorda gelecek.
            // Minimum spawn süresini 0.2'den 0.4'e çektik (Ekranın dolup taşmasını engellemek için)
            this.spawnRate = Math.max(0.4, 2.0 - (Game.score / 1000));
        }
    },

    spawnBatch: function() {
        // Oyuncudan uzakta bir nokta seç (Kamera dışı)
        let angle = Math.random() * Math.PI * 2;
        let dist = 600; // Ekranın biraz dışı
        let px = Game.player.x + Math.cos(angle) * dist;
        let py = Game.player.y + Math.sin(angle) * dist;

        // Harita sınırlarını kontrol et
        px = Math.max(50, Math.min(px, Game.map.width - 50));
        py = Math.max(50, Math.min(py, Game.map.height - 50));

        // Boss veya Normal düşman
        // DÜZENLEME: Boss çıkma sıklığını biraz azalttık (Her 50 skor yerine 100 skorda bir)
        if (Game.score > 0 && Game.score % 100 === 0) {
             Game.enemies.push(new Enemy(px, py, 'boss'));
        } else {
             Game.enemies.push(new Enemy(px, py, 'zombie'));
        }
    }
};

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        this.pushX = 0;
        this.pushY = 0;

        if (type === 'boss') {
            this.radius = 40;
            this.speed = 60; // DÜZENLEME: Hız 80'den 60'a düştü
            this.hp = 400 * (1 + Game.gameLevel * 0.5); // Can 500'den 400'e düştü
            this.color = '#ff0000';
            // GÜNCELLEME: Hasar 15'ten 5'e indirildi (Çok az hasar)
            this.damage = 5; 
            this.xpValue = 100;
        } else {
            this.radius = 15;
            this.speed = 90 + Math.random() * 30; // DÜZENLEME: Hız 120'den 90'a düştü
            this.hp = 20 * (1 + Game.gameLevel * 0.2); // Can 30'dan 20'ye düştü
            this.color = '#ff5555';
            // GÜNCELLEME: Hasar 5'ten 1'e indirildi (Minimum hasar)
            this.damage = 1; 
            this.xpValue = 10;
        }
    }

    update(dt) {
        // Oyuncuya yönel
        let dx = Game.player.x - this.x;
        let dy = Game.player.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }

        // Separation (Diğer düşmanlardan uzaklaşma)
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

        // Sürtünme (İtme kuvvetini azalt)
        this.pushX *= 0.9;
        this.pushY *= 0.9;

        this.x += (dx * this.speed + this.pushX) * dt;
        this.y += (dy * this.speed + this.pushY) * dt;
    }

    draw(ctx) {
        ctx.beginPath();
        // Düşman şekli (Hafif titreyen bir daire - zombi efekti)
        let wobble = Math.sin(Date.now() / 100) * 2;
        
        if (this.type === 'boss') {
            ctx.rect(this.x - this.radius, this.y - this.radius, this.radius*2, this.radius*2);
        } else {
            ctx.arc(this.x, this.y, this.radius + (wobble > 0 ? 1 : 0), 0, Math.PI * 2);
        }
        
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#330000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gözler
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI*2);
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI*2);
        ctx.fill();
    }

    takeDamage(amount) {
        this.hp -= amount;
        
        // Effects nesnesinin varlığını kontrol edelim (Hata almamak için)
        if (typeof Effects !== 'undefined') {
            Effects.spawnBlood(this.x, this.y, '#880000');
            Effects.showDamage(this.x, this.y - 20, amount);
        }
        
        // Geri tepme (Knockback) - Vurulunca geriye savrulma
        let angle = Math.atan2(this.y - Game.player.y, this.x - Game.player.x);
        this.pushX += Math.cos(angle) * 100;
        this.pushY += Math.sin(angle) * 100;

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            Game.score++;
            
            // UI ve Effects kontrolleri
            if (typeof UI !== 'undefined') UI.updateScore(Game.score);
            if (typeof Effects !== 'undefined') Effects.spawnExplosion(this.x, this.y);
        }
    }
}

