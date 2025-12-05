const Effects = {
    particles: [],
    floatingTexts: [],

    spawnBlood: function(x, y, color = '#ff0044') {
        for(let i=0; i<8; i++) {
            this.particles.push(new Particle(x, y, color, Math.random() * 3 + 1));
        }
    },

    spawnExplosion: function(x, y) {
        for(let i=0; i<20; i++) {
            this.particles.push(new Particle(x, y, '#ffaa00', Math.random() * 5 + 2));
        }
    },

    spawnHitEffect: function(x, y) {
        for(let i=0; i<3; i++) {
            this.particles.push(new Particle(x, y, '#ffffff', 2));
        }
    },

    showDamage: function(x, y, amount) {
        this.floatingTexts.push(new FloatingText(x, y, Math.floor(amount), '#fff'));
    },

    update: function(dt) {
        this.particles.forEach((p, i) => {
            p.update(dt);
            if(p.life <= 0) this.particles.splice(i, 1);
        });

        this.floatingTexts.forEach((t, i) => {
            t.update(dt);
            if(t.life <= 0) this.floatingTexts.splice(i, 1);
        });
    },

    draw: function(ctx) {
        this.particles.forEach(p => p.draw(ctx));
        this.floatingTexts.forEach(t => t.draw(ctx));
    }
};

class Particle {
    constructor(x, y, color, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 100 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0; // 1 saniye ömür
        this.decay = Math.random() * 2 + 1;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt * this.decay;
        this.size *= 0.95; // Küçülerek yok ol
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.vy = -50; // Yukarı süzülme
        this.life = 0.8;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}