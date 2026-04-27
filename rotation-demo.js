/* ═══════════════════════════════════════════
   ROTATION DEMO
   Mounts onto .rotation-demo like the pendulums.
   Rotates at 0.05 rad/s and stops after one full
   rotation (2π rad). Click to restart.
   ═══════════════════════════════════════════ */

(function () {

    const container = document.querySelector('.rotation-demo');
    if (!container) return;

    container.innerHTML = '';
    Object.assign(container.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4vh 0 2vh',
        position: 'relative',
        cursor: 'pointer',
    });

    /* ─── canvas ─── */
    const SIZE = 260;
    const canvas = document.createElement('canvas');
    canvas.width  = SIZE;
    canvas.height = SIZE;
    canvas.style.display = 'block';
    container.appendChild(canvas);

    /* ─── label ─── */
    const label = document.createElement('div');
    label.textContent = 'click to start';
    Object.assign(label.style, {
        marginTop: '14px',
        fontSize: '0.65rem',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        transition: 'opacity 0.4s',
    });
    container.appendChild(label);

    /* ─── speed readout ─── */
    const readout = document.createElement('div');
    readout.textContent = '0.015 rad/s';
    Object.assign(readout.style, {
        marginTop: '8px',
        fontSize: '0.7rem',
        letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.2)',
        fontFamily: "'Courier New', monospace",
        transition: 'opacity 0.4s',
    });
    container.appendChild(readout);

    const ctx    = canvas.getContext('2d');
    const cx     = SIZE / 2;
    const cy     = SIZE / 2;
    const RADIUS = SIZE * 0.38;
    const SPEED  = 0.015;          // rad/s
    const FULL   = Math.PI * 2;   // one full rotation

    let angle    = -Math.PI / 2;  // 12 o'clock
    let elapsed  = 0;
    let traveled = 0;             // total radians swept so far
    let running  = false;
    let rafId    = null;
    let lastTime = null;

    function draw() {
        ctx.clearRect(0, 0, SIZE, SIZE);

        /* Outer circle */
        ctx.beginPath();
        ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(142,142,142,1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        /* Swept arc */
        const startA = -Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, RADIUS * 0.82, startA, angle, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(79,79,79,0.5)';
        ctx.fill();

        /* Rotating line */
        const ex = cx + Math.cos(angle) * RADIUS * 0.82;
        const ey = cy + Math.sin(angle) * RADIUS * 0.82;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        /* Centre dot */
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        /* Elapsed time */
        if (elapsed > 0) {
            ctx.fillStyle = 'rgba(142,142,142,1)';
            ctx.font = '11px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${elapsed.toFixed(1)}s`, cx, cy + RADIUS + 22);
        }
    }

    function stop() {
        running = false;
        cancelAnimationFrame(rafId);
        label.style.opacity   = '1';
        readout.style.opacity = '1';
    }

    function step(ts) {
        if (!running) return;
        rafId = requestAnimationFrame(step);

        const dt = lastTime === null ? 0.016 : Math.min((ts - lastTime) / 1000, 0.032);
        lastTime = ts;

        const delta = SPEED * dt;
        elapsed  += dt;
        angle    += delta;
        traveled += delta;

        /* Stop exactly at one full rotation */
        if (traveled >= FULL) {
            angle   = -Math.PI / 2 + FULL; // visually completes the circle
            elapsed += 0;
            draw();
            label.textContent = 'click to restart';
            stop();
            return;
        }

        draw();
    }

    draw();

    container.addEventListener('click', () => {
        /* Always restart from zero */
        angle    = -Math.PI / 2;
        elapsed  = 0;
        traveled = 0;
        label.textContent = 'click to start';
        draw();
        running  = true;
        lastTime = null;
        label.style.opacity   = '0';
        readout.style.opacity = '0.6';
        rafId = requestAnimationFrame(step);
    });

    /* Pause when out of viewport */
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting && running) stop();
        });
    }, { threshold: 0.1 });
    io.observe(container);

})();