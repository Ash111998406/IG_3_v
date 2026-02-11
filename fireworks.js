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
        this.LAUNCH_INTERVAL = 1200; // Slower launch for better performance
        this.lastTime = 0;
        this.rafId = null;
        this.frameCount = 0;

        // Valentine's color palette - romantic pinks, reds, purples, golds
        this.colors = [
            '#ff1493', '#ff69b4', '#ff6b9d', '#c44569', '#ff0066',
            '#ff3399', '#ff99cc', '#ffccff', '#d4af37', '#ffd700',
            '#ffb6c1', '#ff1744', '#e91e63', '#c2185b', '#880e4f',
            '#9c27b0', '#ab47bc', '#ce93d8', '#ffffff', '#fff5f7'
        ];

        // Particle pool for performance
        this.POOL_SIZE = 500; // Reduced from 1000
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
        const fromBottom = Math.random() > 0.3;

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
                particleCount: 12 + Math.floor(Math.random() * 16), // Reduced particle count
                pattern: this.pick(['heart', 'heart', 'heart', 'ring', 'burst', 'star', 'spiral', 'willow']),
                explosionRadius: 60 + Math.random() * 90
            });
        } else {
            this.spawnExplosion(
                x, peakY, color, color2, color3,
                12 + Math.floor(Math.random() * 16),
                this.pick(['heart', 'heart', 'ring', 'burst', 'star', 'spiral']),
                60 + Math.random() * 90
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
                default:
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

        // Pause when tab is hidden to save battery
        if (document.hidden) {
            this.rafId = requestAnimationFrame(this.boundFrame);
            return;
        }

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        // Performance optimization: skip frames on mobile if needed
        this.frameCount++;
        if (this.frameCount % 2 === 0 && window.innerWidth < 768) {
            this.rafId = requestAnimationFrame(this.boundFrame);
            return;
        }

        // Fade effect
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(0, 0, this.w, this.h);

        this.ctx.globalCompositeOperation = 'lighter';

        // Launch rockets (less frequently)
        if (timestamp >= this.nextLaunch) {
            this.launchRocket(timestamp);
            this.nextLaunch = timestamp + this.LAUNCH_INTERVAL + Math.random() * 600;
        }

        // Update rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.progress += dt * r.speed;
            r.y = this.h - (this.h - r.targetY) * Math.min(r.progress, 1);

            // Draw trail
            this.ctx.shadowBlur = 8;
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
        const decay = dt * 0.7;
        const willowDecay = dt * 0.4;

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
                this.ctx.shadowBlur = 15;
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
            
            this.ctx.shadowBlur = 4;
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
            this.rafId = null;
        }
        window.removeEventListener('resize', this.boundResize);
        
        // Clear all arrays
        this.rockets.length = 0;
        for (let i = 0; i < this.POOL_SIZE; i++) {
            this.pool[i].alive = false;
        }
        
        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Nullify references
        this.canvas = null;
        this.ctx = null;
        this.pool = null;
        this.rockets = null;
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
