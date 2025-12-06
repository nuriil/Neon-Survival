const ItemFactory = {
    createXP: function(x, y, value) {
        Game.items.push(new XPOrb(x, y, value));
    },
    createCoin: function(x, y, value) {
        Game.items.push(new Coin(x, y, value));
    }
};

class XPOrb {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 8;
        this.markedForDeletion = false;
        this.isMagnetized = false;
        this.speed = 0;
        this.acceleration = 1500;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.type = 'xp';
    }

    update(dt) {
        if (this.isMagnetized) {
            let dx = Game.player.x - this.x;
            let dy = Game.player.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            this.speed += this.acceleration * dt;
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    draw(ctx) {
        let bobY = Math.sin(Date.now() / 200 + this.floatOffset) * 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffaa'; 
        ctx.fill();
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    collect() {
        this.markedForDeletion = true;
        Game.player.gainXp(this.value);
    }
}

class Coin {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 10;
        this.markedForDeletion = false;
        this.isMagnetized = false;
        this.speed = 0;
        this.acceleration = 1500;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.type = 'coin';
    }

    update(dt) {
        if (this.isMagnetized) {
            let dx = Game.player.x - this.x;
            let dy = Game.player.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            this.speed += this.acceleration * dt;
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    draw(ctx) {
        let bobY = Math.sin(Date.now() / 150 + this.floatOffset) * 3;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; // Altın Rengi
        ctx.fill();
        
        // İçine $ işareti veya çizgi
        ctx.fillStyle = '#B8860B';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', this.x, this.y + bobY + 4);

        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    collect() {
        this.markedForDeletion = true;
        Game.player.gainCoins(this.value);
    }
}
