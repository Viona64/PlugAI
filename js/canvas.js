/* ============================================
   PlugAI — Hero Canvas Animation (Neural Network)
   ============================================ */
(function () {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, nodes = [], mouse = { x: -999, y: -999 };
    const NODE_COUNT = 70;
    const CONNECTION_DIST = 160;
    const MOUSE_DIST = 120;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createNodes() {
        nodes = [];
        for (let i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 2.5 + 1,
                opacity: Math.random() * 0.6 + 0.2,
                pulse: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? '108,99,255' : '0,212,255'
            });
        }
    }

    function drawNodes() {
        nodes.forEach(n => {
            n.pulse += 0.02;
            const alpha = n.opacity * (0.7 + 0.3 * Math.sin(n.pulse));

            // Glow
            const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
            grd.addColorStop(0, `rgba(${n.color},${alpha * 0.6})`);
            grd.addColorStop(1, `rgba(${n.color},0)`);
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${n.color},${alpha})`;
            ctx.fill();
        });
    }

    function drawConnections() {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.25;
                    const grd = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                    grd.addColorStop(0, `rgba(${a.color},${alpha})`);
                    grd.addColorStop(1, `rgba(${b.color},${alpha})`);
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = grd;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    function drawMouseConnections() {
        nodes.forEach(n => {
            const dx = n.x - mouse.x, dy = n.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_DIST) {
                const alpha = (1 - dist / MOUSE_DIST) * 0.7;
                ctx.beginPath();
                ctx.moveTo(mouse.x, mouse.y);
                ctx.lineTo(n.x, n.y);
                ctx.strokeStyle = `rgba(108,99,255,${alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    }

    function updateNodes() {
        nodes.forEach(n => {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;

            // Mouse repel
            const dx = n.x - mouse.x, dy = n.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                n.x += (dx / dist) * 1.5;
                n.y += (dy / dist) * 1.5;
            }
        });
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);

        // Dark vignette
        const vgrd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
        vgrd.addColorStop(0, 'rgba(15,23,42,0)');
        vgrd.addColorStop(1, 'rgba(15,23,42,0.6)');
        ctx.fillStyle = vgrd;
        ctx.fillRect(0, 0, W, H);

        drawConnections();
        drawMouseConnections();
        drawNodes();
        updateNodes();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => { resize(); createNodes(); });
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

    resize();
    createNodes();
    animate();
})();
