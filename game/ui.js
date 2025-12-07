const SKINS_DB = [
    { id: 'default', name: 'Klasik Mavi', price: 0, color: '#00d2ff', shape: 'circle', desc: 'Dengeli.', bonuses: {} },
    { id: 'red_sq', name: 'Kızıl Kare', price: 1500, color: '#ff0000', shape: 'square', desc: 'Hasar +%20, Can +20', bonuses: { damage: 1.2, maxHp: 20 } },
    { id: 'green_ci', name: 'Zehir Yeşili', price: 2500, color: '#00ff00', shape: 'circle', desc: 'Hız +%20, Seri Ateş +%10', bonuses: { speed: 1.2, fireRate: 0.9 } }, 
    { id: 'gold_sq', name: 'Altın Şövalye', price: 6000, color: '#ffd700', shape: 'square', desc: 'Zırh +%15, Can +50', bonuses: { armor: 0.15, maxHp: 50 } },
    { id: 'dark_void', name: 'Kara Delik', price: 12000, color: '#000000', shape: 'circle', desc: 'Hasar x2, Zırh -%20', bonuses: { damage: 2.0, armor: -0.2 } }
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
    bossWarning: null,
    notification: null,
    
    shopModal: null,
    coinDisplay: null,

    init: function() {
        this.createCoinDisplay();
        this.createShopModal();
        this.createBossWarning();
        this.createNotification();
    },

    createCoinDisplay: function() {
        let div = document.createElement('div');
        div.style.position = 'fixed'; div.style.top = '60px'; div.style.left = '20px';
        div.style.fontSize = '24px'; div.style.color = '#FFD700';
        div.style.fontFamily = 'Orbitron, sans-serif'; div.style.textShadow = '0 0 5px black';
        div.style.zIndex = '1000'; 
        div.innerHTML = `💰 <span id="coin-count">0</span>`;
        document.body.appendChild(div);
        this.coinDisplay = document.getElementById('coin-count');
    },

    createBossWarning: function() {
        let div = document.createElement('div');
        div.id = 'boss-warning';
        div.style.position = 'fixed'; div.style.top = '20%'; div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.fontSize = '60px'; div.style.color = '#ff0000';
        div.style.fontFamily = 'Orbitron, sans-serif'; div.style.textShadow = '0 0 20px red';
        div.style.fontWeight = 'bold';
        div.style.display = 'none';
        div.style.zIndex = '2000';
        div.innerText = "⚠️ BOSS GELİYOR ⚠️";
        document.body.appendChild(div);
        this.bossWarning = div;
    },

    createNotification: function() {
        let div = document.createElement('div');
        div.id = 'game-notification';
        div.style.position = 'fixed'; div.style.top = '100px'; div.style.left = '50%';
        div.style.transform = 'translate(-50%, 0)';
        div.style.fontSize = '30px'; div.style.color = '#fff';
        div.style.fontFamily = 'Orbitron, sans-serif'; div.style.textShadow = '0 0 10px black';
        div.style.fontWeight = 'bold';
        div.style.display = 'none';
        div.style.zIndex = '1900';
        div.style.textAlign = 'center';
        document.body.appendChild(div);
        this.notification = div;
    },

    showBossWarning: function(show) {
        if(this.bossWarning) this.bossWarning.style.display = show ? 'block' : 'none';
    },

    showNotification: function(text, color = 'white') {
        if (!this.notification) return;
        this.notification.innerText = text;
        this.notification.style.color = color;
        this.notification.style.display = 'block';
        this.notification.style.opacity = '1';
        
        // Animasyonlu kayboluş
        setTimeout(() => {
            this.notification.style.display = 'none';
        }, 3000);
    },

    createShopModal: function() {
        let modal = document.createElement('div');
        modal.id = 'shop-modal';
        modal.style.display = 'none';
        modal.style.position = 'fixed'; modal.style.top = '50%'; modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = 'rgba(15, 15, 25, 0.98)';
        modal.style.padding = '30px'; modal.style.borderRadius = '15px';
        modal.style.border = '2px solid #FFD700'; modal.style.width = '900px';
        modal.style.maxHeight = '90vh'; modal.style.overflowY = 'auto';
        modal.style.color = 'white'; modal.style.fontFamily = 'Orbitron, sans-serif';
        modal.style.zIndex = '99999'; modal.style.boxShadow = '0 0 50px rgba(0,0,0,0.8)';

        let header = document.createElement('div');
        header.innerHTML = '<h2 style="text-align:center; color:#FFD700;">MARKET</h2>';
        header.innerHTML += '<div style="text-align:center; margin-bottom:20px;">Bakiyeniz: <span id="shop-money" style="color:#FFD700">0</span> 💰</div>';
        
        let contentDiv = document.createElement('div');
        contentDiv.id = 'shop-content';

        let closeBtn = document.createElement('button');
        closeBtn.innerText = 'KAPAT (E)';
        closeBtn.style.marginTop = '20px'; closeBtn.style.width = '100%';
        closeBtn.style.padding = '15px'; closeBtn.style.background = '#333';
        closeBtn.style.color = 'white'; closeBtn.style.border = '2px solid #555';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => this.closeShop();

        modal.appendChild(header);
        modal.appendChild(contentDiv);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        this.shopModal = modal;
    },

    openShop: function() {
        if (!this.shopModal) return;
        Game.isShopOpen = true;
        Game.pauseGame();
        this.shopModal.style.display = 'block'; 
        this.refreshShopItems();
    },

    closeShop: function() {
        Game.isShopOpen = false;
        Game.resumeGame();
        if (this.shopModal) this.shopModal.style.display = 'none';
    },

    refreshShopItems: function() {
        let coins = Game.player ? Game.player.coins : 0;
        document.getElementById('shop-money').innerText = coins;
        const contentDiv = document.getElementById('shop-content');
        contentDiv.innerHTML = ''; 

        // 1. ÖZEL EŞYA: BOT (MERCENARY)
        let botHeader = document.createElement('h3');
        botHeader.innerText = "🤖 YARDIMCI BOT";
        botHeader.style.color = "#00d2ff"; botHeader.style.borderBottom = "1px solid #555";
        contentDiv.appendChild(botHeader);

        let botDiv = document.createElement('div');
        botDiv.style.background = '#2a2a3a'; botDiv.style.padding = '15px';
        botDiv.style.borderRadius = '8px'; botDiv.style.display = 'flex';
        botDiv.style.justifyContent = 'space-between'; botDiv.style.alignItems = 'center';
        botDiv.style.marginBottom = '20px';

        let currentBotPrice = Game.shop.botPrice + (Game.shop.botCount * 1000);
        let maxBots = 3;
        
        botDiv.innerHTML = `
            <div>
                <div style="font-weight:bold; font-size:18px;">Klon Savaşçı</div>
                <div style="font-size:12px; color:#aaa;">Seninle aynı silaha sahip, düşmanları avlar. (Boss savaşında saklanır)</div>
                <div style="color:#FFD700; margin-top:5px;">Fiyat: ${currentBotPrice} 💰</div>
            </div>
        `;
        
        let buyBotBtn = document.createElement('button');
        buyBotBtn.style.padding = '10px 20px';
        if (Game.shop.botCount >= maxBots) {
            buyBotBtn.innerText = "MAX SEVİYE";
            buyBotBtn.disabled = true;
            buyBotBtn.style.background = '#555';
        } else {
            buyBotBtn.innerText = "SATIN AL";
            buyBotBtn.style.background = coins >= currentBotPrice ? '#e63946' : '#555';
            buyBotBtn.disabled = coins < currentBotPrice;
            buyBotBtn.onclick = () => {
                if(coins >= currentBotPrice) {
                    Game.player.coins -= currentBotPrice;
                    Game.shop.botCount++;
                    Game.bots.push(new Bot(Game.player.x, Game.player.y));
                    Effects.showDamage(Game.player.x, Game.player.y, "BOT GELDİ!", "#00d2ff");
                    this.refreshShopItems();
                    UI.updateCoins(Game.player.coins);
                }
            };
        }
        botDiv.appendChild(buyBotBtn);
        contentDiv.appendChild(botDiv);

        // 2. SİLAHLAR
        let weaponHeader = document.createElement('h3');
        weaponHeader.innerText = "🔫 SİLAHLAR";
        weaponHeader.style.color = "#00ffaa";
        weaponHeader.style.borderBottom = "1px solid #555";
        contentDiv.appendChild(weaponHeader);

        let weaponGrid = document.createElement('div');
        weaponGrid.style.display = 'grid'; weaponGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        weaponGrid.style.gap = '15px'; weaponGrid.style.marginBottom = '30px';

        WEAPONS.forEach((weapon, index) => {
            let itemDiv = document.createElement('div');
            itemDiv.style.background = '#2a2a3a'; itemDiv.style.padding = '10px';
            itemDiv.style.borderRadius = '8px'; itemDiv.style.textAlign = 'center';
            
            let isOwned = Game.player.ownedWeapons.includes(index);
            let isActive = Game.player.weapon.currentWeaponIndex === index;
            itemDiv.style.border = isActive ? '2px solid #00ff00' : '1px solid #444';

            itemDiv.innerHTML = `<div style="font-weight:bold; color:${weapon.color};">${weapon.name}</div>
                                 <div style="font-size:11px; color:#aaa;">Hsr: ${weapon.damage}</div>
                                 <div style="color:#FFD700">${isOwned ? '' : weapon.price + ' 💰'}</div>`;
            
            let btn = document.createElement('button');
            btn.style.width = '100%'; btn.style.marginTop = '5px';
            
            if (isActive) {
                btn.innerText = 'AKTİF'; btn.disabled = true;
            } else if (isOwned) {
                btn.innerText = 'KUŞAN'; btn.onclick = () => { Game.player.weapon.switchWeapon(index); this.refreshShopItems(); };
            } else {
                btn.innerText = 'AL'; btn.disabled = coins < weapon.price;
                btn.onclick = () => { if(Game.player.buyWeapon(index, weapon.price)) this.refreshShopItems(); };
            }
            itemDiv.appendChild(btn);
            weaponGrid.appendChild(itemDiv);
        });
        contentDiv.appendChild(weaponGrid);

        // 3. KOSTÜMLER
        let skinHeader = document.createElement('h3');
        skinHeader.innerText = "👕 KOSTÜMLER";
        skinHeader.style.color = "#00ffaa";
        skinHeader.style.borderBottom = "1px solid #555";
        contentDiv.appendChild(skinHeader);

        let skinGrid = document.createElement('div');
        skinGrid.style.display = 'grid'; skinGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        skinGrid.style.gap = '15px';

        let currentSkinId = Game.player.currentSkin.id;
        let ownedSkins = Game.player.ownedSkins;

        SKINS_DB.forEach(skin => {
            let itemDiv = document.createElement('div');
            itemDiv.style.background = '#2a2a3a'; itemDiv.style.padding = '10px';
            itemDiv.style.borderRadius = '8px'; itemDiv.style.textAlign = 'center';
            itemDiv.style.border = currentSkinId === skin.id ? '2px solid #00ff00' : '1px solid #444';
            
            let shape = skin.shape === 'square' ? 'border-radius:0;' : 'border-radius:50%;';
            itemDiv.innerHTML = `<div style="width:20px;height:20px;background:${skin.color};margin:0 auto;${shape}"></div>
                                 <div style="font-weight:bold;">${skin.name}</div>
                                 <div style="font-size:10px;color:#ccc;">${skin.desc}</div>
                                 <div style="color:#FFD700;">${skin.price} 💰</div>`;
            
            let btn = document.createElement('button');
            btn.style.width = '100%'; btn.style.marginTop = '5px';

            if (ownedSkins.includes(skin.id)) {
                if (currentSkinId === skin.id) {
                    btn.innerText = 'GİYİLDİ'; btn.disabled = true;
                } else {
                    btn.innerText = 'GİY'; btn.onclick = () => { Game.player.setSkin(skin); this.refreshShopItems(); };
                }
            } else {
                btn.innerText = 'AL'; btn.disabled = coins < skin.price;
                btn.onclick = () => { 
                    if (coins >= skin.price) {
                        Game.player.coins -= skin.price;
                        Game.player.ownedSkins.push(skin.id);
                        this.refreshShopItems();
                    }
                };
            }
            itemDiv.appendChild(btn);
            skinGrid.appendChild(itemDiv);
        });
        contentDiv.appendChild(skinGrid);
    },

    updateCoins: function(amount) {
        if(this.coinDisplay) this.coinDisplay.innerText = amount;
    },

    updateHp: function(current, max) {
        let pct = Math.max(0, (current / max) * 100);
        if(this.hpBar) this.hpBar.style.width = pct + '%';
        if(this.hpText) this.hpText.innerText = Math.ceil(current) + '/' + max;
    },

    updateScore: function(score) { if(this.score) this.score.innerText = score; },
    updateXp: function(current, max) { if(this.xpBar) this.xpBar.style.width = (current/max*100) + '%'; },
    updateLevel: function(lvl) { if(this.level) this.level.innerText = lvl; },

    showUpgradeMenu: function() {
        Game.pauseGame();
        this.upgradeModal.classList.remove('hidden');
        this.upgradeModal.style.display = 'block'; 
        
        let title = this.upgradeModal.querySelector('h2');
        if(title) title.innerText = "SEVİYE ATLADIN!";

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
            { id: 'dmg', name: 'Hasar', desc: '%50 Ekstra hasar.', icon: '⚔️' },
            { id: 'spd', name: 'Hız', desc: '%30 Daha hızlı.', icon: '👟' },
            { id: 'multi', name: 'Çoklu Atış', desc: '+2 Mermi.', icon: '🍒' },
            { id: 'fire', name: 'Seri Ateş', desc: '%40 Daha seri.', icon: '🔥' },
            { id: 'armor', name: 'Zırh', desc: '%30 Hasar azaltma.', icon: '🛡️' },
            { id: 'magnet', name: 'Mıknatıs', desc: 'Eşyaları uzaktan çeker.', icon: '🧲' },
            { id: 'pierce', name: 'Delici', desc: 'Mermiler delip geçer.', icon: '🏹' },
            { id: 'regen', name: 'Yenilenme', desc: 'Saniyede +5 Can.', icon: '❤️' },
            { id: 'maxhp', name: 'Can Deposu', desc: '+50 Max Can.', icon: '💊' }
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
                <div style="font-size:10px; color:#ff5555; margin-top:5px;">(BU LEVEL BOYUNCA)</div>
            `;
            card.onclick = () => this.applyUpgrade(opt.id);
            this.cardsContainer.appendChild(card);
        });
    },

    applyUpgrade: function(type) {
        if(!Game.player) return;
        const p = Game.player;
        const w = p.weapon;

        switch(type) {
            case 'dmg': w.modifiers.damage *= 1.5; break; 
            case 'spd': p.speed *= 1.30; break;
            case 'multi': w.modifiers.count += 2; break;
            case 'fire': w.modifiers.fireRate *= 0.6; break;
            case 'armor': p.armor += 0.3; break; 
            case 'magnet': p.magnetRange += 150; break;
            case 'pierce': w.modifiers.pierce += 10; break;
            case 'regen': p.regen += 5; break;
            case 'maxhp': p.maxHp += 50; p.hp += 50; break;
        }
        
        this.updateHp(p.hp, p.maxHp);
        this.hideUpgradeMenu();
    }
};
