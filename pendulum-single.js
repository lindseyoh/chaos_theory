/* ═══════════════════════════════════════════
   SINGLE PENDULUM
   ═══════════════════════════════════════════ */

(function () {
    const container = document.querySelector('.single_pendulum');
    if (!container) return;

    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.cursor = 'pointer';

    const CW = 700;
    const CH = 620;

    const canvas = document.createElement('canvas');
    canvas.width  = CW;
    canvas.height = CH;
    Object.assign(canvas.style, {
        position: 'absolute',
        left: '50%',
        top:  '50%',
        transform: 'translate(-50%, -50%)',
        display: 'block',
        pointerEvents: 'none',
    });

    const clickLayer = document.createElement('div');
    Object.assign(clickLayer.style, {
        position: 'absolute', inset: '0', zIndex: '2', cursor: 'pointer',
    });

    container.appendChild(canvas);
    container.appendChild(clickLayer);

    const label = document.createElement('div');
    label.textContent = 'click to start';
    Object.assign(label.style, {
        position: 'absolute', bottom: '12px', width: '100%',
        textAlign: 'center', fontSize: '0.65rem',
        letterSpacing: '0.25em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
        transition: 'opacity 0.4s', zIndex: '3',
    });
    container.appendChild(label);

    const ctx = canvas.getContext('2d');

    /* Pivot at 22% from top — original feel */
    const ox = CW / 2;
    const oy = CH * 0.22;
    const L   = CH * 0.52;
    const g   = 9.81;
    const pxM = CH / 3.5;
    const DAMPING = 0.9995;

    let angle    = Math.PI / 4;
    let velocity = 0;
    let running  = false;
    let rafId    = null;
    let lastTime = null;

    const TRAIL_LEN = 220;
    const trail = [];

    function bobPos() {
        return {
            x: ox + Math.sin(angle) * L,
            y: oy + Math.cos(angle) * L,
        };
    }

    function step(ts) {
        if (!running) return;
        rafId = requestAnimationFrame(step);
        const dt = lastTime === null ? 0.016 : Math.min((ts - lastTime) / 1000, 0.032);
        lastTime = ts;

        const acc = (a) => -(g / (L / pxM)) * Math.sin(a);
        const k1v = acc(angle),               k1a = velocity;
        const k2v = acc(angle + 0.5*dt*k1a), k2a = velocity + 0.5*dt*k1v;
        const k3v = acc(angle + 0.5*dt*k2a), k3a = velocity + 0.5*dt*k2v;
        const k4v = acc(angle +    dt*k3a),  k4a = velocity +    dt*k3v;

        velocity = (velocity + (dt/6)*(k1v + 2*k2v + 2*k3v + k4v)) * DAMPING;
        angle    =  angle   + (dt/6)*(k1a + 2*k2a + 2*k3a + k4a);

        const bob = bobPos();
        trail.push({ x: bob.x, y: bob.y });
        if (trail.length > TRAIL_LEN) trail.shift();
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, CW, CH);
        const bob = bobPos();

        for (let i = 1; i < trail.length; i++) {
            const t = i / trail.length;
            ctx.beginPath();
            ctx.moveTo(trail[i-1].x, trail[i-1].y);
            ctx.lineTo(trail[i].x,   trail[i].y);
            ctx.strokeStyle = `rgba(255,255,255,${t * 0.45})`;
            ctx.lineWidth = t * 1.8;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(bob.x, bob.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bob.x, bob.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    draw();

    const INIT_ANGLE = Math.PI / 4;

    clickLayer.addEventListener('click', () => {
        if (running) {
            running = false;
            cancelAnimationFrame(rafId);
            label.style.opacity = '1';
        } else {
            /* Reset to initial position before each run */
            angle    = INIT_ANGLE;
            velocity = 0;
            trail.length = 0;
            draw();
            running  = true;
            lastTime = null;
            label.style.opacity = '0';
            rafId = requestAnimationFrame(step);
        }
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting && running) {
                running = false;
                cancelAnimationFrame(rafId);
                label.style.opacity = '1';
            }
        });
    }, { threshold: 0.1 });
    io.observe(container);
})();