const SKINS_DB = [
    { id: 'default', name: 'Klasik Mavi', price: 0, color: '#00d2ff', shape: 'circle' },
    { id: 'red_sq', name: 'Kızıl Kare', price: 1000, color: '#ff0000', shape: 'square' },
    { id: 'green_ci', name: 'Zehir Yeşili', price: 1500, color: '#00ff00', shape: 'circle' },
    { id: 'gold_sq', name: 'Altın Şövalye', price: 5000, color: '#ffd700', shape: 'square' },
    { id: 'dark_void', name: 'Kara Delik', price: 10000, color: '#000000', shape: 'circle' }
];

const UI = {
    hpBar: document.getElementById('hp-bar-fill'),
    hpText: document.getElementById('hp-text'),
    score: document.getElementById('score'),
    xpBar: document.getElementById('xp-bar-fill'),
    level: document.getElementById('level'),
    upgradeModal: document.getElementById('upgrade-modal'),
    cardsContainer: document.getElementById('cards-container'),
    gameOverScreen: document.getElementById('game-over-screen'),
    finalScore: document.getElementById('final-score'),
    
    shopModal: null,
    coinDisplay: null,

    init: function() {
        this.createCoinDisplay();
        this.createShopModal();
    },

    createCoinDisplay: function() {
        // Z-Index artırıldı
        let div = document.createElement('div');
        div.style.position = 'fixed'; // Absolute yerine fixed daha garantidir
        div.style.top = '60px';
        div.style.left = '20px';
        div.style.fontSize = '24px';
        div.style.color = '#FFD700';
        div.style.fontFamily = 'Orbitron, sans-serif';
        div.style.textShadow = '0 0 5px black';
        div.style.zIndex = '1000'; 
        div.innerHTML = `💰 <span id="coin-count">0</span>`;
        document.body.appendChild(div);
        this.coinDisplay = document.getElementById('coin-count');
    },

    createShopModal: function() {
        let modal = document.createElement('div');
        modal.id = 'shop-modal';
        
        // Z-Index en üste çekildi (99999)
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = 'rgba(20, 20, 30, 0.98)';
        modal.style.padding = '30px';
        modal.style.borderRadius = '15px';
        modal.style.border = '2px solid #FFD700';
        modal.style.width = '800px';
        modal.style.maxHeight = '80vh';
        modal.style.overflowY = 'auto';
        modal.style.color = 'white';
        modal.style.fontFamily = 'Orbitron, sans-serif';
        modal.style.zIndex = '99999'; // EN ÖNEMLİ KISIM
        modal.style.boxShadow = '0 0 50px rgba(0,0,0,0.8)';

        let header = document.createElement('div');
        header.innerHTML = '<h2 style="text-align:center; color:#FFD700; margin-bottom:20px;">MARKET</h2>';
        header.innerHTML += '<div style="text-align:center; margin-bottom:20px; font-size: 20px;">Bakiyeniz: <span id="shop-money" style="color:#FFD700">0</span> 💰</div>';
        
        let grid = document.createElement('div');
        grid.id = 'shop-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '20px';

        let closeBtn = document.createElement('button');
        closeBtn.innerText = 'KAPAT (E)';
        closeBtn.style.marginTop = '20px';
        closeBtn.style.width = '100%';
        closeBtn.style.padding = '15px';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.background = '#333';
        closeBtn.style.color = 'white';
        closeBtn.style.border = '2px solid #555';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => this.closeShop();

        modal.appendChild(header);
        modal.appendChild(grid);
        modal.appendChild(closeBtn);
        
        // Eğer body hazır değilse hata vermemesi için kontrol
        if(document.body) {
            document.body.appendChild(modal);
        } else {
            console.error("HATA: document.body hazır değil! Script etiketlerini </body> öncesine koyun.");
            window.addEventListener('load', () => document.body.appendChild(modal));
        }
        
        this.shopModal = modal;
    },

    openShop: function() {
        if (!this.shopModal) return;
        
        console.log("Market açılıyor..."); // F12 Konsolda bunu görmelisiniz
        Game.isShopOpen = true;
        Game.pauseGame();
        
        // CSS class çakışmasını önlemek için inline stil basıyoruz
        this.shopModal.style.display = 'block'; 
        this.shopModal.classList.remove('hidden'); // Varsa hidden classını sil
        
        this.refreshShopItems();
    },

    closeShop: function() {
        Game.isShopOpen = false;
        Game.resumeGame();
        if (this.shopModal) {
            this.shopModal.style.display = 'none';
        }
    },

    refreshShopItems: function() {
        // Güvenlik kontrolü: Player veya coins yoksa varsayılan kullan
        let coins = Game.player ? Game.player.coins : 0;
        let currentSkinId = (Game.player && Game.player.currentSkin) ? Game.player.currentSkin.id : 'default';
        let ownedSkins = (Game.player && Game.player.ownedSkins) ? Game.player.ownedSkins : ['default'];

        let shopMoney = document.getElementById('shop-money');
        if(shopMoney) shopMoney.innerText = coins;
        
        const grid = document.getElementById('shop-grid');
        if(!grid) return;
        
        grid.innerHTML = '';

        SKINS_DB.forEach(skin => {
            let itemDiv = document.createElement('div');
            itemDiv.style.background = '#2a2a3a';
            itemDiv.style.padding = '15px';
            itemDiv.style.borderRadius = '10px';
            itemDiv.style.textAlign = 'center';
            itemDiv.style.border = currentSkinId === skin.id ? '2px solid #00ff00' : '1px solid #444';

            let shapeStyle = skin.shape === 'square' ? 'border-radius:0;' : 'border-radius:50%;';
            let preview = `<div style="width:40px; height:40px; background:${skin.color}; margin:0 auto 10px; ${shapeStyle}"></div>`;
            let name = `<div style="font-weight:bold; margin-bottom:5px;">${skin.name}</div>`;
            let priceText = skin.price > 0 ? skin.price + ' 💰' : 'Bedava';
            let price = `<div style="color:#FFD700; margin-bottom:10px;">${priceText}</div>`;
            
            let btn = document.createElement('button');
            btn.style.padding = '8px 20px';
            btn.style.cursor = 'pointer';
            btn.style.border = 'none';
            btn.style.borderRadius = '5px';
            btn.style.fontWeight = 'bold';
            
            if (ownedSkins.includes(skin.id)) {
                if (currentSkinId === skin.id) {
                    btn.innerText = 'GİYİLDİ';
                    btn.disabled = true;
                    btn.style.background = '#00ff00';
                    btn.style.color = '#000';
                } else {
                    btn.innerText = 'GİY';
                    btn.style.background = '#00d2ff';
                    btn.style.color = '#fff';
                    btn.onclick = () => {
                        if(Game.player) Game.player.setSkin(skin);
                        this.refreshShopItems();
                    };
                }
            } else {
                btn.innerText = 'SATIN AL';
                btn.style.background = '#e63946';
                btn.style.color = '#fff';
                
                if (coins >= skin.price) {
                    btn.onclick = () => {
                        if(Game.player) {
                            Game.player.coins -= skin.price;
                            Game.player.ownedSkins.push(skin.id);
                            this.updateCoins(Game.player.coins);
                            Effects.showDamage(Game.player.x, Game.player.y, "Satın Alındı!", "#00ff00");
                            this.refreshShopItems();
                        }
                    };
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.innerText = 'YETERSİZ';
                }
            }

            itemDiv.innerHTML = preview + name + price;
            itemDiv.appendChild(btn);
            grid.appendChild(itemDiv);
        });
    },

    updateCoins: function(amount) {
        if(this.coinDisplay) this.coinDisplay.innerText = amount;
        let shopMoney = document.getElementById('shop-money');
        if(shopMoney) shopMoney.innerText = amount;
    },

    updateHp: function(current, max) {
        let pct = Math.max(0, (current / max) * 100);
        if(this.hpBar) this.hpBar.style.width = pct + '%';
        if(this.hpText) this.hpText.innerText = Math.ceil(current) + '/' + max;
    },

    updateScore: function(score) {
        if(this.score) this.score.innerText = score;
    },

    updateXp: function(current, max) {
        let pct = (current / max) * 100;
        if(this.xpBar) this.xpBar.style.width = pct + '%';
    },

    updateLevel: function(lvl) {
        if(this.level) this.level.innerText = lvl;
    },

    showUpgradeMenu: function() {
        Game.pauseGame();
        this.upgradeModal.classList.remove('hidden');
        this.upgradeModal.style.display = 'block'; 
        this.generateCards();
    },

    hideUpgradeMenu: function() {
        this.upgradeModal.classList.add('hidden');
        this.upgradeModal.style.display = 'none';
        Game.resumeGame();
    },

    showGameOver: function() {
        this.gameOverScreen.classList.remove('hidden');
        this.finalScore.innerText = Game.score;
    },

    generateCards: function() {
        this.cardsContainer.innerHTML = '';
        
        const options = [
            { id: 'dmg', name: 'Hasar Artışı', desc: 'Mermi hasarını %20 artırır.', icon: '⚔️' },
            { id: 'spd', name: 'Hız Artışı', desc: 'Hareket hızını %15 artırır.', icon: '⚡' },
            { id: 'multi', name: 'Çoklu Mermi', desc: '+1 Mermi sayısı.', icon: '🍒' },
            { id: 'fire', name: 'Seri Ateş', desc: 'Ateş hızını %15 artırır.', icon: '🔥' },
            { id: 'hp', name: 'Can Yenileme', desc: '%30 can doldurur.', icon: '❤️' }
        ];

        for(let i=0; i<3; i++) {
            let opt = options[Math.floor(Math.random() * options.length)];
            
            let card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="card-icon">${opt.icon}</div>
                <div class="card-title">${opt.name}</div>
                <div class="card-desc">${opt.desc}</div>
            `;
            
            card.onclick = () => this.applyUpgrade(opt.id);
            this.cardsContainer.appendChild(card);
        }
    },

    applyUpgrade: function(type) {
        if(!Game.player) return;
        const p = Game.player;
        const w = p.weapon;

        switch(type) {
            case 'dmg': w.modifiers.damage *= 1.2; break;
            case 'spd': p.speed *= 1.15; break;
            case 'multi': w.modifiers.count++; break;
            case 'fire': w.modifiers.fireRate *= 0.85; break;
            case 'hp': p.hp = Math.min(p.hp + p.maxHp * 0.3, p.maxHp); break;
        }
        
        this.hideUpgradeMenu();
    }
};

