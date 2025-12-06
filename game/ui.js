// Kostümler ve Statları
const SKINS_DB = [
    { 
        id: 'default', name: 'Klasik Mavi', price: 0, 
        color: '#00d2ff', shape: 'circle', 
        desc: 'Dengeli başlangıç.',
        bonuses: {} // Bonus yok
    },
    { 
        id: 'red_sq', name: 'Kızıl Kare', price: 1500, 
        color: '#ff0000', shape: 'square', 
        desc: 'Hasar +%20, Can +20',
        bonuses: { damage: 1.2, maxHp: 20 }
    },
    { 
        id: 'green_ci', name: 'Zehir Yeşili', price: 2500, 
        color: '#00ff00', shape: 'circle', 
        desc: 'Hız +%20, Seri Ateş +%10',
        bonuses: { speed: 1.2, fireRate: 1.1 }
    },
    { 
        id: 'gold_sq', name: 'Altın Şövalye', price: 6000, 
        color: '#ffd700', shape: 'square', 
        desc: 'Zırh +%15, Can +50',
        bonuses: { armor: 0.15, maxHp: 50 }
    },
    { 
        id: 'dark_void', name: 'Kara Delik', price: 12000, 
        color: '#000000', shape: 'circle', 
        desc: 'Hasar x2, Zırh -%20',
        bonuses: { damage: 2.0, armor: -0.2 } // Riskli kostüm
    }
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
        let div = document.createElement('div');
        div.style.position = 'fixed';
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
        
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = 'rgba(15, 15, 25, 0.98)';
        modal.style.padding = '30px';
        modal.style.borderRadius = '15px';
        modal.style.border = '2px solid #FFD700';
        modal.style.width = '900px';
        modal.style.maxHeight = '90vh';
        modal.style.overflowY = 'auto';
        modal.style.color = 'white';
        modal.style.fontFamily = 'Orbitron, sans-serif';
        modal.style.zIndex = '99999';
        modal.style.boxShadow = '0 0 50px rgba(0,0,0,0.8)';

        let header = document.createElement('div');
        header.innerHTML = '<h2 style="text-align:center; color:#FFD700; margin-bottom:10px;">MARKET</h2>';
        header.innerHTML += '<div style="text-align:center; margin-bottom:20px; font-size: 20px;">Bakiyeniz: <span id="shop-money" style="color:#FFD700">0</span> 💰</div>';
        
        let contentDiv = document.createElement('div');
        contentDiv.id = 'shop-content';

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
        modal.appendChild(contentDiv);
        modal.appendChild(closeBtn);
        
        if(document.body) {
            document.body.appendChild(modal);
        } else {
            window.addEventListener('load', () => document.body.appendChild(modal));
        }
        
        this.shopModal = modal;
    },

    openShop: function() {
        if (!this.shopModal) return;
        Game.isShopOpen = true;
        Game.pauseGame();
        this.shopModal.style.display = 'block'; 
        this.shopModal.classList.remove('hidden');
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
        let coins = Game.player ? Game.player.coins : 0;
        let shopMoney = document.getElementById('shop-money');
        if(shopMoney) shopMoney.innerText = coins;
        
        const contentDiv = document.getElementById('shop-content');
        if(!contentDiv) return;
        contentDiv.innerHTML = ''; 

        // --- SİLAHLAR ---
        let weaponHeader = document.createElement('h3');
        weaponHeader.innerText = "🔫 SİLAHLAR";
        weaponHeader.style.color = "#00ffaa";
        weaponHeader.style.borderBottom = "1px solid #555";
        weaponHeader.style.paddingBottom = "5px";
        contentDiv.appendChild(weaponHeader);

        let weaponGrid = document.createElement('div');
        weaponGrid.style.display = 'grid';
        weaponGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        weaponGrid.style.gap = '15px';
        weaponGrid.style.marginBottom = '30px';

        WEAPONS.forEach((weapon, index) => {
            let itemDiv = document.createElement('div');
            itemDiv.style.background = '#2a2a3a';
            itemDiv.style.padding = '10px';
            itemDiv.style.borderRadius = '8px';
            itemDiv.style.textAlign = 'center';
            
            let isOwned = Game.player && Game.player.ownedWeapons.includes(index);
            let isActive = Game.player && Game.player.weapon.currentWeaponIndex === index;

            itemDiv.style.border = isActive ? '2px solid #00ff00' : '1px solid #444';

            let name = `<div style="font-weight:bold; color:${weapon.color}; margin-bottom:5px;">${weapon.name}</div>`;
            let stats = `<div style="font-size:11px; color:#aaa; margin-bottom:5px;">Hsr: ${weapon.damage} | Hız: ${weapon.fireRate}s</div>`;
            
            let btn = document.createElement('button');
            btn.style.width = '100%';
            btn.style.padding = '5px';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';
            btn.style.marginTop = '5px';

            if (isActive) {
                btn.innerText = 'AKTİF';
                btn.disabled = true;
                btn.style.background = '#444';
                btn.style.color = '#fff';
            } else if (isOwned) {
                btn.innerText = 'KUŞAN';
                btn.style.background = '#00d2ff';
                btn.onclick = () => {
                    Game.player.weapon.switchWeapon(index);
                    this.refreshShopItems();
                };
            } else {
                btn.innerText = 'SATIN AL';
                btn.style.background = coins >= weapon.price ? '#e63946' : '#555';
                btn.disabled = coins < weapon.price;
                btn.onclick = () => {
                    if(Game.player.buyWeapon(index, weapon.price)) {
                        this.refreshShopItems();
                    }
                };
            }

            itemDiv.innerHTML = name + stats + `<div style="color:#FFD700">${isOwned ? '' : weapon.price + ' 💰'}</div>`;
            itemDiv.appendChild(btn);
            weaponGrid.appendChild(itemDiv);
        });
        contentDiv.appendChild(weaponGrid);

        // --- KOSTÜMLER ---
        let skinHeader = document.createElement('h3');
        skinHeader.innerText = "👕 KOSTÜMLER (Özel Statlı)";
        skinHeader.style.color = "#00ffaa";
        skinHeader.style.borderBottom = "1px solid #555";
        skinHeader.style.paddingBottom = "5px";
        contentDiv.appendChild(skinHeader);

        let skinGrid = document.createElement('div');
        skinGrid.style.display = 'grid';
        skinGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        skinGrid.style.gap = '15px';

        let currentSkinId = (Game.player && Game.player.currentSkin) ? Game.player.currentSkin.id : 'default';
        let ownedSkins = (Game.player && Game.player.ownedSkins) ? Game.player.ownedSkins : ['default'];

        SKINS_DB.forEach(skin => {
            let itemDiv = document.createElement('div');
            itemDiv.style.background = '#2a2a3a';
            itemDiv.style.padding = '10px';
            itemDiv.style.borderRadius = '8px';
            itemDiv.style.textAlign = 'center';
            itemDiv.style.border = currentSkinId === skin.id ? '2px solid #00ff00' : '1px solid #444';

            let shapeStyle = skin.shape === 'square' ? 'border-radius:0;' : 'border-radius:50%;';
            let preview = `<div style="width:30px; height:30px; background:${skin.color}; margin:0 auto 5px; ${shapeStyle}"></div>`;
            let name = `<div style="font-size:14px; font-weight:bold; margin-bottom:5px;">${skin.name}</div>`;
            let desc = `<div style="font-size:11px; color:#ccc; margin-bottom:8px; min-height:30px;">${skin.desc}</div>`;
            
            let btn = document.createElement('button');
            btn.style.width = '100%';
            btn.style.padding = '5px';
            btn.style.cursor = 'pointer';
            
            if (ownedSkins.includes(skin.id)) {
                if (currentSkinId === skin.id) {
                    btn.innerText = 'GİYİLDİ';
                    btn.disabled = true;
                    btn.style.background = '#444';
                } else {
                    btn.innerText = 'GİY';
                    btn.style.background = '#00d2ff';
                    btn.onclick = () => {
                        Game.player.setSkin(skin);
                        this.refreshShopItems();
                    };
                }
            } else {
                btn.innerText = 'AL';
                btn.style.background = coins >= skin.price ? '#e63946' : '#555';
                btn.disabled = coins < skin.price;
                btn.onclick = () => {
                    if (coins >= skin.price) {
                        Game.player.coins -= skin.price;
                        Game.player.ownedSkins.push(skin.id);
                        this.refreshShopItems();
                    }
                };
            }

            itemDiv.innerHTML = preview + name + desc + `<div style="color:#FFD700; font-size:12px; margin-bottom:5px">${skin.price} 💰</div>`;
            itemDiv.appendChild(btn);
            skinGrid.appendChild(itemDiv);
        });
        contentDiv.appendChild(skinGrid);
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
        
        // BU KARTLAR GEÇİCİDİR (TEK LEVELLİK)
        const options = [
            { id: 'dmg', name: 'Hasar Patlaması', desc: 'Bu level boyunca %50 daha fazla hasar.', icon: '⚔️' },
            { id: 'spd', name: 'Rüzgarın Oğlu', desc: 'Bu level boyunca %30 hızlan.', icon: '👟' },
            { id: 'multi', name: 'Mermi Yağmuru', desc: 'Bu level boyunca +2 Mermi.', icon: '🍒' },
            { id: 'fire', name: 'Makinalı', desc: 'Bu level boyunca %40 seri ateş.', icon: '🔥' },
            { id: 'armor', name: 'Kaya', desc: 'Bu level boyunca %30 daha az hasar al.', icon: '🛡️' },
            { id: 'magnet', name: 'Büyük Çekim', desc: 'Bu level boyunca eşyaları uzaktan çek.', icon: '🧲' },
            { id: 'pierce', name: 'Delici', desc: 'Bu level boyunca mermiler herkesi deler.', icon: '🏹' }
        ];

        let selected = [];
        let pool = [...options];
        for(let i=0; i<3; i++) {
            if(pool.length === 0) break;
            let rnd = Math.floor(Math.random() * pool.length);
            selected.push(pool[rnd]);
            pool.splice(rnd, 1);
        }

        selected.forEach(opt => {
            let card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="card-icon">${opt.icon}</div>
                <div class="card-title">${opt.name}</div>
                <div class="card-desc">${opt.desc}</div>
                <div style="font-size:10px; color:#ff5555; margin-top:5px;">(TEK LEVELLİK)</div>
            `;
            card.onclick = () => this.applyUpgrade(opt.id);
            this.cardsContainer.appendChild(card);
        });
    },

    applyUpgrade: function(type) {
        if(!Game.player) return;
        const p = Game.player;
        const w = p.weapon;

        // Player.js'de levelUp() içinde "resetLevelStats" çağrıldığı için
        // şu an statlar tertemiz (Base + Skin).
        // Şimdi üzerine GEÇİCİ bonusu ekliyoruz.
        // Bir sonraki levelda bunlar silinecek.

        switch(type) {
            case 'dmg': w.modifiers.damage *= 1.5; break; // Çok yüksek boost
            case 'spd': p.speed *= 1.30; break;
            case 'multi': w.modifiers.count += 2; break;
            case 'fire': w.modifiers.fireRate *= 0.6; break; // Cooldown süresi düşer = hızlanır
            case 'armor': p.armor += 0.3; break; 
            case 'magnet': p.magnetRange += 150; break;
            case 'pierce': w.modifiers.pierce += 10; break; // Neredeyse sonsuz delme
        }
        
        this.updateHp(p.hp, p.maxHp);
        this.hideUpgradeMenu();
    }
};
