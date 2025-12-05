const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    lastTime: 0,
    isRunning: false,
    isPaused: false,
    
    // Oyun Sistemleri
    player: null,
    map: null,
    camera: { x: 0, y: 0 },
    enemies: [],
    bullets: [],
    items: [],
    particles: [],
    damageTexts: [],
    
    score: 0,
    gameLevel: 1,

    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas boyutlandırma
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Sistemleri Başlat
        this.map = new GameMap(3000, 3000);
        this.player = new Player(1500, 1500); // Harita ortası
        this.setupInputs();
        
        this.isRunning = true;
        this.isPaused = false;
        
        EnemySpawner.reset();
        
        requestAnimationFrame((t) => this.loop(t));
    },

    resize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    },

    setupInputs: function() {
        // Klavye
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        // Mouse
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    },

    loop: function(timestamp) {
        if (!this.isRunning) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update(dt);
            this.draw();
        }
        
        requestAnimationFrame((t) => this.loop(t));
    },

    update: function(dt) {
        if (dt > 0.1) dt = 0.1; // Lag koruması

        // Kamera Takibi (Smooth Lerp)
        // Kamerayı oyuncuya doğru yavaşça kaydır
        let targetCamX = this.player.x - this.width / 2;
        let targetCamY = this.player.y - this.height / 2;
        
        // Harita sınırlarına sadık kal
        targetCamX = Math.max(0, Math.min(targetCamX, this.map.width - this.width));
        targetCamY = Math.max(0, Math.min(targetCamY, this.map.height - this.height));

        // Lerp formülü: current + (target - current) * speed
        this.camera.x += (targetCamX - this.camera.x) * 5 * dt;
        this.camera.y += (targetCamY - this.camera.y) * 5 * dt;

        // Mouse Dünya Koordinatı (Nişan almak için)
        this.mouse.worldX = this.mouse.x + this.camera.x;
        this.mouse.worldY = this.mouse.y + this.camera.y;

        this.player.update(dt);
        EnemySpawner.update(dt);
        
        // Objeleri güncelle
        this.bullets.forEach((b, i) => {
            b.update(dt);
            if (b.markedForDeletion) this.bullets.splice(i, 1);
        });

        this.enemies.forEach((e, i) => {
            e.update(dt);
            if (e.markedForDeletion) {
                // Ölünce item düşür
                if (Math.random() < 0.5) ItemFactory.createXP(e.x, e.y, 10);
                this.enemies.splice(i, 1);
            }
        });

        this.items.forEach((item, i) => {
            item.update(dt);
            if (item.markedForDeletion) this.items.splice(i, 1);
        });

        Effects.update(dt);
        CollisionManager.check();
    },

    draw: function() {
        // Arkaplanı temizle
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 1. Zemin
        this.map.draw(this.ctx, this.camera);

        // 2. Yerdeki Itemlar (Alt katman)
        this.items.forEach(i => i.draw(this.ctx));

        // 3. Karakterler ve Düşmanlar (Gölge efekti verelim)
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 10;
        
        this.enemies.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);
        
        this.ctx.shadowBlur = 0; // Gölgeyi kapat

        // 4. Mermiler (Glow efekti ile)
        this.ctx.globalCompositeOperation = 'lighter'; // Parlama efekti
        this.bullets.forEach(b => b.draw(this.ctx));
        this.ctx.globalCompositeOperation = 'source-over'; // Normale dön

        // 5. Efektler (Patlamalar, yazılar)
        Effects.draw(this.ctx);

        this.ctx.restore();
    },
    
    pauseGame: function() {
        this.isPaused = true;
    },
    
    resumeGame: function() {
        this.isPaused = false;
        this.lastTime = performance.now(); // Zamanı düzelt
    }
};

const CollisionManager = {
    check: function() {
        // Mermi vs Düşman
        Game.bullets.forEach(bullet => {
            Game.enemies.forEach(enemy => {
                if (this.isColliding(bullet, enemy)) {
                    enemy.takeDamage(bullet.damage);
                    bullet.markedForDeletion = true;
                    // Vuruş efekti
                    Effects.spawnHitEffect(bullet.x, bullet.y);
                }
            });
        });

        // Düşman vs Oyuncu
        Game.enemies.forEach(enemy => {
            if (this.dist(enemy.x, enemy.y, Game.player.x, Game.player.y) < (enemy.radius + Game.player.radius)) {
                Game.player.takeDamage(enemy.damage);
            }
        });

        // Item vs Oyuncu
        Game.items.forEach(item => {
            let d = this.dist(item.x, item.y, Game.player.x, Game.player.y);
            // Magnet menziline girdi mi?
            if (d < Game.player.magnetRange) {
                item.isMagnetized = true;
            }
            // Toplandı mı?
            if (d < Game.player.radius + item.radius) {
                item.collect();
            }
        });
    },

    isColliding: function(circle1, circle2) {
        let dx = circle1.x - circle2.x;
        let dy = circle1.y - circle2.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        return dist < (circle1.radius + circle2.radius);
    },

    dist: function(x1, y1, x2, y2) {
        return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
    }
};