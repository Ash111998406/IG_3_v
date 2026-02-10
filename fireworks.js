// Valentine's Fireworks - Vanilla JavaScript Version
// Add romantic fireworks with hearts and pink/red colors

class ValentineFireworks {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.mounted = true;
        this.w = 0;
        this.h = 0;
        this.rockets = [];
        this.nextLaunch = 0;
        this.LAUNCH_INTERVAL = 800; // Slightly slower for romantic effect
        this.lastTime = 0;
        this.rafId = null;

        // Valentine's color palette - romantic pinks, reds, purples, golds
        this.colors = [
            '#ff1493', // Deep pink
            '#ff69b4', // Hot pink
            '#ff6b9d', // Rose
            '#c44569', // Deep rose
            '#ff0066', // Bright red-pink
            '#ff3399', // Pink
            '#ff99cc', // Light pink
            '#ffccff', // Pale pink
            '#d4af37', // Gold
            '#ffd700', // Bright gold
            '#ffb6c1', // Light pink
            '#ff1744', // Red
            '#e91e63', // Pink red
            '#c2185b', // Dark pink
            '#880e4f', // Deep purple-pink
            '#9c27b0', // Purple
            '#ab47bc', // Light purple
            '#ce93d8', // Pale purple
            '#ffffff', // White sparkle
            '#fff5f7'  // Cream white
        ];

        // Particle pool for performance
        this.POOL_SIZE = 1000;
        this.pool = Array.from({ length: this.POOL_SIZE }, () => ({
            alive: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            color: '#fff',
            size: 2,
            type: 'particle',
            gravity: 0
        }));
        this.poolIdx = 0;

        this.init();
    }

    pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    acquire() {
        for (let i = 0; i < this.POOL_SIZE; i++) {
            const idx = (this.poolIdx + i) % this.POOL_SIZE;
            if (!this.pool[idx].alive) {
                this.poolIdx = (idx + 1) % this.POOL_SIZE;
                return this.pool[idx];
            }
        }
        // Force-recycle oldest
        this.poolIdx = (this.poolIdx + 1) % this.POOL_SIZE;
        return this.pool[this.poolIdx];
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    init() {
        this.resize();
        this.boundResize = () => this.resize();
        window.addEventListener('resize', this.boundResize);
        this.boundFrame = (timestamp) => this.frame(timestamp);
        this.rafId = requestAnimationFrame(this.boundFrame);
    }

    launchRocket(now) {
        const x = 0.1 * this.w + Math.random() * 0.8 * this.w;
        const peakY = 0.1 * this.h + Math.random() * 0.4 * this.h;
        const color = this.pick(this.colors);
        const color2 = this.pick(this.colors);
        const color3 = this.pick(this.colors);
        const speed = 0.7 + Math.random() * 0.5;
        const fromBottom = Math.random() > 0.3; // More bottom launches for visibility

        if (fromBottom) {
            this.rockets.push({
                x,
                y: this.h,
                targetY: peakY,
                color,
                color2,
                color3,
                speed,
                alive: true,
                progress: 0,
                particleCount: 16 + Math.floor(Math.random() * 24),
                // Favor hearts and romantic patterns
                pattern: this.pick(['heart', 'heart', 'heart', 'ring', 'burst', 'star', 'spiral', 'willow']),
                explosionRadius: 70 + Math.random() * 110
            });
        } else {
            // Sky burst
            this.spawnExplosion(
                x, peakY, color, color2, color3,
                16 + Math.floor(Math.random() * 24),
                this.pick(['heart', 'heart', 'ring', 'burst', 'star', 'spiral']),
                70 + Math.random() * 110
            );
        }
    }

    spawnExplosion(x, y, color, color2, color3, count, pattern, radius) {
        // Central flash
        const flash = this.acquire();
        flash.alive = true;
        flash.x = x;
        flash.y = y;
        flash.vx = 0;
        flash.vy = 0;
        flash.life = 1;
        flash.maxLife = 1;
        flash.color = color;
        flash.size = radius * 0.5;
        flash.type = 'flash';
        flash.gravity = 0;

        for (let i = 0; i < count; i++) {
            let angle, rMul = 1;
            
            switch (pattern) {
                case 'ring':
                    angle = (i / count) * Math.PI * 2;
                    break;
                case 'spiral':
                    angle = (i / count) * Math.PI * 4;
                    rMul = i / count;
                    break;
                case 'heart': {
                    // Heart shape formula
                    const t = (i / count) * Math.PI * 2;
                    const hx = 16 * Math.pow(Math.sin(t), 3);
                    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                    angle = Math.atan2(hy, hx);
                    rMul = Math.sqrt(hx * hx + hy * hy) / 18;
                    break;
                }
                case 'star': {
                    angle = (i / count) * Math.PI * 2;
                    rMul = (i % 2 === 0) ? 1.2 : 0.6;
                    break;
                }
                case 'willow':
                    angle = (i / count) * Math.PI * 2;
                    rMul = 0.7 + Math.random() * 0.6;
                    break;
                default: // burst
                    angle = (i / count) * Math.PI * 2;
                    rMul = 0.6 + Math.random() * 0.8;
                    break;
            }

            const speed = radius * rMul * (0.018 + Math.random() * 0.012);
            const p = this.acquire();
            p.alive = true;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 1;
            p.maxLife = 1;
            p.color = i % 5 === 0 ? color2 : i % 7 === 0 ? color3 : color;
            p.size = 2.5 + Math.random() * 2.5;
            p.type = pattern === 'willow' ? 'willow' : 'particle';
            p.gravity = pattern === 'willow' ? 0.06 : 0.04;
        }
    }

    frame(timestamp) {
        if (!this.mounted) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        // Fade effect
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'; // Lighter fade for more glow
        this.ctx.fillRect(0, 0, this.w, this.h);

        this.ctx.globalCompositeOperation = 'lighter';

        // Launch rockets
        if (timestamp >= this.nextLaunch) {
            this.launchRocket(timestamp);
            this.nextLaunch = timestamp + this.LAUNCH_INTERVAL + Math.random() * 500;
        }

        // Update rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.progress += dt * r.speed;
            r.y = this.h - (this.h - r.targetY) * Math.min(r.progress, 1);

            // Draw trail with glow
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = r.color;
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = r.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            if (r.progress >= 1) {
                this.spawnExplosion(
                    r.x, r.targetY, r.color, r.color2, r.color3,
                    r.particleCount, r.pattern, r.explosionRadius
                );
                this.rockets.splice(i, 1);
            }
        }

        // Update & draw particles
        const decay = dt * 0.65;
        const willowDecay = dt * 0.35;

        for (let i = 0; i < this.POOL_SIZE; i++) {
            const p = this.pool[i];
            if (!p.alive) continue;

            if (p.type === 'flash') {
                p.life -= dt * 3.5;
                if (p.life <= 0) {
                    p.alive = false;
                    continue;
                }
                const a = p.life;
                const sz = p.size * (1 - p.life * 0.4);
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color + Math.round(a * 255).toString(16).padStart(2, '0');
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                continue;
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= p.type === 'willow' ? willowDecay : decay;

            if (p.life <= 0) {
                p.alive = false;
                continue;
            }

            const a = Math.max(0, Math.min(1, p.life));
            const sz = p.size * (0.3 + a * 0.7);
            
            // Add subtle glow to particles
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color + Math.round(a * 255).toString(16).padStart(2, '0');
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.rafId = requestAnimationFrame(this.boundFrame);
    }

    destroy() {
        this.mounted = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        window.removeEventListener('resize', this.boundResize);
        this.rockets.length = 0;
        for (let i = 0; i < this.POOL_SIZE; i++) {
            this.pool[i].alive = false;
        }
    }
}

// Initialize fireworks when DOM is ready
function initValentineFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    if (canvas) {
        return new ValentineFireworks(canvas);
    }
    return null;
}
