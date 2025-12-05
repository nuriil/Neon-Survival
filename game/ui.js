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

    updateHp: function(current, max) {
        let pct = Math.max(0, (current / max) * 100);
        this.hpBar.style.width = pct + '%';
        this.hpText.innerText = Math.ceil(current) + '/' + max;
    },

    updateScore: function(score) {
        this.score.innerText = score;
    },

    updateXp: function(current, max) {
        let pct = (current / max) * 100;
        this.xpBar.style.width = pct + '%';
    },

    updateLevel: function(lvl) {
        this.level.innerText = lvl;
    },

    showUpgradeMenu: function() {
        Game.pauseGame();
        this.upgradeModal.classList.remove('hidden');
        this.generateCards();
    },

    hideUpgradeMenu: function() {
        this.upgradeModal.classList.add('hidden');
        Game.resumeGame();
    },

    showGameOver: function() {
        this.gameOverScreen.classList.remove('hidden');
        this.finalScore.innerText = Game.score;
    },

    generateCards: function() {
        this.cardsContainer.innerHTML = '';
        
        // 3 Rastgele özellik seç
        const options = [
            { id: 'dmg', name: 'Hasar Artışı', desc: 'Mermi hasarını %20 artırır.', icon: '⚔️' },
            { id: 'spd', name: 'Hız Artışı', desc: 'Hareket hızını %15 artırır.', icon: '⚡' },
            { id: 'multi', name: 'Çoklu Mermi', desc: '+1 Mermi sayısı.', icon: '🍒' },
            { id: 'fire', name: 'Seri Ateş', desc: 'Ateş hızını %15 artırır.', icon: '🔥' },
            { id: 'hp', name: 'Can Yenileme', desc: '%30 can doldurur.', icon: '❤️' }
        ];

        // Rastgele 3 tane seç
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
        const p = Game.player;
        const w = p.weapon;

        switch(type) {
            case 'dmg': w.damage *= 1.2; break;
            case 'spd': p.speed *= 1.15; break;
            case 'multi': w.bulletCount++; break;
            case 'fire': w.fireRate *= 0.85; break;
            case 'hp': p.hp = Math.min(p.hp + p.maxHp * 0.3, p.maxHp); break;
        }
        
        this.hideUpgradeMenu();
    }
};