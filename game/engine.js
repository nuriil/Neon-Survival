const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    lastTime: 0,
    isRunning: false,
    isPaused: false,
    isShopOpen: false,
    
    // Oyun Durumu
    bossMode: false, // Boss savaşı aktif mi?
    
    // Varlıklar
    player: null,
    bots: [], // Satın alınan yardımcılar
    map: null,
    camera: { x: 0, y: 0 },
    enemies: [],
    bullets: [], // Oyuncu mermileri
    enemyBullets: [], // Boss mermileri
    items: [],
    chests: [], // Hazine sandıkları
    particles: [],
    
    score: 0,
    gameLevel: 1,

    // Market Verisi
    shop: {
        x: 1500,
        y: 1500,
        radius: 100, 
        safeZoneRadius: 350, 
        active: true,
        botPrice: 1200, // Bot başlangıç fiyatı
        botCount: 0 // Kaç bot alındı
    },

    keys: {},
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, down: false },

    // Zamanlayıcılar
    chestTimer: 0,

    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        UI.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.map = new GameMap(3000, 3000);
        this.player = new Player(1400, 1500); 
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
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'KeyP' && !this.isShopOpen) {
                if (this.isPaused) this.resumeGame();
                else this.pauseGame();
            }
            if (e.code === 'KeyE') this.checkShopInteraction();
            
            // Silah Değişimi
            if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
                const weaponIndex = parseInt(e.key) - 1;
                if (this.player.ownedWeapons.includes(weaponIndex)) {
                     this.player.weapon.switchWeapon(weaponIndex);
                }
            }
        });

        window.addEventListener('keyup', e => this.keys[e.code] = false);
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', e => { if(e.button === 0) this.mouse.down = true; });
        window.addEventListener('mouseup', e => { if(e.button === 0) this.mouse.down = false; });
    },

    checkShopInteraction: function() {
        let dist = Math.sqrt((this.player.x - this.shop.x)**2 + (this.player.y - this.shop.y)**2);
        if (dist < this.shop.radius + 100) {
            if (this.isShopOpen) UI.closeShop();
            else UI.openShop();
        }
    },

    loop: function(timestamp) {
        if (!this.isRunning) return;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update(dt);
            this.draw();
        } else if (this.isShopOpen) {
            this.draw(); 
        } else {
            this.draw();
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = "white";
            this.ctx.font = "50px Orbitron";
            this.ctx.textAlign = "center";
            this.ctx.fillText("PAUSED", this.width/2, this.height/2);
        }
        requestAnimationFrame((t) => this.loop(t));
    },

    update: function(dt) {
        if (dt > 0.1) dt = 0.1;

        // Kamera
        let targetCamX = this.player.x - this.width / 2;
        let targetCamY = this.player.y - this.height / 2;
        targetCamX = Math.max(0, Math.min(targetCamX, this.map.width - this.width));
        targetCamY = Math.max(0, Math.min(targetCamY, this.map.height - this.height));
        this.camera.x += (targetCamX - this.camera.x) * 5 * dt;
        this.camera.y += (targetCamY - this.camera.y) * 5 * dt;
        this.mouse.worldX = this.mouse.x + this.camera.x;
        this.mouse.worldY = this.mouse.y + this.camera.y;

        // Update Entity'leri
        this.player.update(dt);
        
        // Botlar (Boss savaşında yok olurlar)
        if (!this.bossMode) {
            this.bots.forEach(bot => bot.update(dt));
        }

        EnemySpawner.update(dt);
        
        // Mermiler
        this.bullets.forEach((b, i) => {
            b.update(dt);
            if (b.markedForDeletion) this.bullets.splice(i, 1);
        });

        // Düşman Mermileri (Boss Ateşi)
        this.enemyBullets.forEach((b, i) => {
            b.update(dt);
            if (b.markedForDeletion) this.enemyBullets.splice(i, 1);
        });

        // Düşmanlar
        this.enemies.forEach((e, i) => {
            e.update(dt);
            if (e.markedForDeletion) {
                // Boss öldü mü?
                if (e.type === 'boss') {
                    this.bossMode = false; // Normal moda dön
                    ItemFactory.createCoin(e.x, e.y, 2000); // Büyük ödül
                    UI.showBossWarning(false); // Yazıyı kaldır
                } else {
                    ItemFactory.createCoin(e.x, e.y, 30);
                    if (Math.random() < 0.6) ItemFactory.createXP(e.x, e.y, 15);
                }
                this.enemies.splice(i, 1);
            }
        });

        // Eşyalar
        this.items.forEach((item, i) => {
            item.update(dt);
            if (item.markedForDeletion) this.items.splice(i, 1);
        });

        // Sandık Spawner
        if (!this.bossMode) {
            this.chestTimer -= dt;
            if (this.chestTimer <= 0) {
                ItemFactory.createChest();
                this.chestTimer = Math.random() * 60 + 60; // 60-120 saniyede bir
            }
        }
        
        this.chests.forEach((c, i) => {
            if(c.markedForDeletion) this.chests.splice(i, 1);
        });

        Effects.update(dt);
        CollisionManager.check();
    },

    draw: function() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.map.draw(this.ctx, this.camera);
        this.map.drawShop(this.ctx);

        // Yerdeki Eşyalar ve Sandıklar
        this.items.forEach(i => i.draw(this.ctx));
        this.chests.forEach(c => c.draw(this.ctx));

        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 10;
        
        this.enemies.forEach(e => e.draw(this.ctx));
        
        // Botlar
        if (!this.bossMode) {
            this.bots.forEach(b => b.draw(this.ctx));
        }

        this.player.draw(this.ctx);
        
        this.ctx.shadowBlur = 0;

        // Mermiler
        this.ctx.globalCompositeOperation = 'lighter';
        this.bullets.forEach(b => b.draw(this.ctx));
        
        // Düşman Mermileri (Kırmızı/Turuncu)
        this.enemyBullets.forEach(b => b.draw(this.ctx));
        this.ctx.globalCompositeOperation = 'source-over';

        Effects.draw(this.ctx);
        
        // Market Yazısı
        let dist = Math.sqrt((this.player.x - this.shop.x)**2 + (this.player.y - this.shop.y)**2);
        if (dist < this.shop.radius + 100) {
            this.ctx.fillStyle = "white";
            this.ctx.font = "20px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Market için 'E' bas", this.shop.x, this.shop.y - 120);
        }

        this.ctx.restore();
    },
    
    pauseGame: function() { this.isPaused = true; },
    resumeGame: function() { this.isPaused = false; this.lastTime = performance.now(); }
};

const CollisionManager = {
    check: function() {
        // 1. Oyuncu Mermileri vs Düşmanlar
        Game.bullets.forEach(bullet => {
            Game.enemies.forEach(enemy => {
                if (this.isColliding(bullet, enemy)) {
                    enemy.takeDamage(bullet.damage);
                    bullet.pierce--; 
                    if (bullet.pierce <= 0) bullet.markedForDeletion = true;
                    Effects.spawnHitEffect(bullet.x, bullet.y);
                }
            });
            // Mermiler vs Engeller
            Game.map.obstacles.forEach(obs => {
                if (this.isColliding(bullet, obs)) {
                    bullet.markedForDeletion = true;
                    Effects.spawnHitEffect(bullet.x, bullet.y);
                }
            });
        });

        // 2. Boss Mermileri vs Oyuncu (ve Botlar)
        Game.enemyBullets.forEach(bullet => {
            // Oyuncuya değdi mi?
            if (this.isColliding(bullet, Game.player)) {
                Game.player.takeDamage(bullet.damage);
                bullet.markedForDeletion = true;
            }
            // Botlara değdi mi? (Opsiyonel, şimdilik botlar hasar almasın karmaşa olmasın)
            
            // Duvarlara değdi mi?
             Game.map.obstacles.forEach(obs => {
                if (this.isColliding(bullet, obs)) {
                    bullet.markedForDeletion = true;
                    Effects.spawnHitEffect(bullet.x, bullet.y);
                }
            });
        });

        // 3. Düşman vs Oyuncu / Botlar
        Game.enemies.forEach(enemy => {
            if (this.dist(enemy.x, enemy.y, Game.player.x, Game.player.y) < (enemy.radius + Game.player.radius)) {
                Game.player.takeDamage(enemy.damage);
            }
            // Botlarla çarpışma (Botlar sadece iter)
            if (!Game.bossMode) {
                Game.bots.forEach(bot => {
                     if (this.dist(enemy.x, enemy.y, bot.x, bot.y) < (enemy.radius + bot.radius)) {
                        // İtme efekti
                        let angle = Math.atan2(enemy.y - bot.y, enemy.x - bot.x);
                        enemy.pushX += Math.cos(angle) * 100;
                        enemy.pushY += Math.sin(angle) * 100;
                    }
                });
            }
            
            this.resolveMapCollision(enemy);
        });

        // 4. Oyuncu vs Engel & Sandık
        this.resolveMapCollision(Game.player);
        
        // Oyuncu vs Sandık (Collision değil, trigger)
        Game.chests.forEach(chest => {
            if (this.isColliding(Game.player, chest)) {
                chest.open();
            }
        });

        // 5. Eşyalar vs Oyuncu
        Game.items.forEach(item => {
            let d = this.dist(item.x, item.y, Game.player.x, Game.player.y);
            if (d < Game.player.magnetRange) {
                item.isMagnetized = true;
            }
            if (d < Game.player.radius + item.radius) {
                item.collect();
            }
        });
    },

    resolveMapCollision: function(entity) {
        Game.map.obstacles.forEach(obs => {
            let dx = entity.x - obs.x;
            let dy = entity.y - obs.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            let minDist = entity.radius + obs.radius;

            if (dist < minDist) {
                let angle = Math.atan2(dy, dx);
                let pushForce = minDist - dist;
                entity.x += Math.cos(angle) * pushForce;
                entity.y += Math.sin(angle) * pushForce;
            }
        });
    },

    isColliding: function(c1, c2) {
        let dx = c1.x - c2.x;
        let dy = c1.y - c2.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        return dist < (c1.radius + c2.radius);
    },

    dist: function(x1, y1, x2, y2) { return Math.sqrt((x1-x2)**2 + (y1-y2)**2); }
};

