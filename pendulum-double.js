/* ═══════════════════════════════════════════
   DOUBLE PENDULUM
   Container 1 — solo double pendulum.
   Container 2 — twin comparison on one canvas:
     two pendulums, same starting angle, velocity
     offset by 0.001 rad/s. Divergence is visible
     within a few seconds. White vs warm orange.
   ═══════════════════════════════════════════ */

(function () {

    /* ─── physics ─── */

    function makeState(a1, a2, v1 = 0, v2 = 0) {
        return { a1, a2, v1, v2 };
    }

    function dpAccel(s, m1, m2, L1, L2, g) {
        const { a1, a2, v1, v2 } = s;
        const d = a1 - a2, M = m1 + m2;
        const num1 = -g*(2*m1+m2)*Math.sin(a1) - m2*g*Math.sin(a1-2*a2)
                   - 2*Math.sin(d)*m2*(v2*v2*L2 + v1*v1*L1*Math.cos(d));
        const num2 =  2*Math.sin(d)*(v1*v1*L1*M + g*M*Math.cos(a1) + v2*v2*L2*m2*Math.cos(d));
        return { al1: num1 / (L1*(2*M - m2*Math.cos(2*d))),
                 al2: num2 / (L2*(2*M - m2*Math.cos(2*d))) };
    }

    function rk4Step(s, dt, m1, m2, L1, L2, g) {
        const deriv = st => {
            const { al1, al2 } = dpAccel(st, m1, m2, L1, L2, g);
            return { da1: st.v1, da2: st.v2, dv1: al1, dv2: al2 };
        };
        const add = (st, d, h) => makeState(
            st.a1+h*d.da1, st.a2+h*d.da2, st.v1+h*d.dv1, st.v2+h*d.dv2
        );
        const k1 = deriv(s);
        const k2 = deriv(add(s, k1, dt/2));
        const k3 = deriv(add(s, k2, dt/2));
        const k4 = deriv(add(s, k3, dt));
        return makeState(
            s.a1+(dt/6)*(k1.da1+2*k2.da1+2*k3.da1+k4.da1),
            s.a2+(dt/6)*(k1.da2+2*k2.da2+2*k3.da2+k4.da2),
            s.v1+(dt/6)*(k1.dv1+2*k2.dv1+2*k3.dv1+k4.dv1),
            s.v2+(dt/6)*(k1.dv2+2*k2.dv2+2*k3.dv2+k4.dv2),
        );
    }

    function bobPos(s, ox, oy, L1, L2) {
        const x1 = ox + L1*Math.sin(s.a1), y1 = oy + L1*Math.cos(s.a1);
        return { x1, y1, x2: x1+L2*Math.sin(s.a2), y2: y1+L2*Math.cos(s.a2) };
    }

    /* ─── generic canvas builder ─── */

    function buildPendulum(container, opts) {
        container.innerHTML = '';
        container.style.position = 'relative';

        const CW = 700, CH = 580;
        const canvas = document.createElement('canvas');
        canvas.width = CW; canvas.height = CH;
        Object.assign(canvas.style, {
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            display: 'block', pointerEvents: 'none',
        });

        const clickLayer = document.createElement('div');
        Object.assign(clickLayer.style, {
            position: 'absolute', inset: '0', zIndex: '2', cursor: 'pointer',
        });

        const label = document.createElement('div');
        label.textContent = 'click to start';
        Object.assign(label.style, {
            position: 'absolute', bottom: '12px', width: '100%',
            textAlign: 'center', fontSize: '0.65rem', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            pointerEvents: 'none', transition: 'opacity 0.4s', zIndex: '3',
        });

        container.appendChild(canvas);
        container.appendChild(clickLayer);
        container.appendChild(label);

        const ctx = canvas.getContext('2d');
        const ox = CW / 2, oy = CH * 0.22;
        const PHYS = { m1:1, m2:1, L1: CH*0.28, L2: CH*0.28, g: 9.81*(CH/3) };
        const TRAIL_LEN = 300;

        /* Each arm: initial state, trail, rgb colour */
        const initStates = opts.arms.map(a => makeState(a.a1, a.a2, a.v1 || 0, a.v2 || 0));
        const arms = opts.arms.map((a, i) => ({
            state: makeState(a.a1, a.a2, a.v1 || 0, a.v2 || 0),
            trail: [],
            rgb: a.rgb,
        }));

        let running = false, rafId = null, lastTime = null;

        function drawTrail(arm) {
            const [r,g,b] = arm.rgb;
            if (arm.trail.length > 1) {
                for (let i = 1; i < arm.trail.length; i++) {
                    const t = i / arm.trail.length;
                    ctx.beginPath();
                    ctx.moveTo(arm.trail[i-1].x, arm.trail[i-1].y);
                    ctx.lineTo(arm.trail[i].x,   arm.trail[i].y);
                    ctx.strokeStyle = `rgba(${r},${g},${b},${t * 0.5})`;
                    ctx.lineWidth = t * 2;
                    ctx.stroke();
                }
            }
        }

        function drawRods(arm) {
            const { x1,y1,x2,y2 } = bobPos(arm.state, ox, oy, PHYS.L1, PHYS.L2);
            const [r,g,b] = arm.rgb;

            /* Rods tinted with the arm's own colour so both are always visible */
            ctx.strokeStyle = `rgba(${r},${g},${b},0.75)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(x1,y1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();

            ctx.beginPath(); ctx.arc(x1,y1, 9, 0, Math.PI*2);
            ctx.fillStyle = `rgba(${r},${g},${b},0.9)`; ctx.fill();
            ctx.beginPath(); ctx.arc(x2,y2, 9, 0, Math.PI*2);
            ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill();
        }

        function draw() {
            ctx.clearRect(0, 0, CW, CH);
            /* Trails first (background layer) */
            arms.forEach(drawTrail);
            /* Rods + bobs on top, each in their own colour */
            arms.forEach(drawRods);
            /* Shared pivot dot drawn last so it's always on top */
            ctx.beginPath(); ctx.arc(ox,oy, 4, 0, Math.PI*2);
            ctx.fillStyle = 'white'; ctx.fill();
        }

        function step(ts) {
            if (!running) return;
            rafId = requestAnimationFrame(step);
            const dt = lastTime === null ? 0.016 : Math.min((ts-lastTime)/1000, 0.032);
            lastTime = ts;
            arms.forEach(arm => {
                arm.state = rk4Step(arm.state, dt, PHYS.m1, PHYS.m2, PHYS.L1, PHYS.L2, PHYS.g);
                const { x2,y2 } = bobPos(arm.state, ox, oy, PHYS.L1, PHYS.L2);
                arm.trail.push({x:x2, y:y2});
                if (arm.trail.length > TRAIL_LEN) arm.trail.shift();
            });
            draw();
        }

        draw();

        clickLayer.addEventListener('click', () => {
            if (running) {
                running = false;
                cancelAnimationFrame(rafId);
                label.style.opacity = '1';
            } else {
                /* Reset every arm to its initial state before each run */
                arms.forEach((arm, i) => {
                    arm.state = { ...initStates[i] };
                    arm.trail = [];
                });
                draw();
                running  = true;
                lastTime = null;
                label.style.opacity = '0';
                rafId = requestAnimationFrame(step);
            }
        });

        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting && running) {
                    running = false; cancelAnimationFrame(rafId); label.style.opacity = '1';
                }
            });
        }, { threshold: 0.1 });
        io.observe(container);
    }

    /* ─── wire up ─── */

    const containers = document.querySelectorAll('.double_pendulum');

    /* Solo double pendulum — white */
    if (containers[0]) {
        buildPendulum(containers[0], {
            arms: [
                { a1: Math.PI/4, a2: Math.PI/4, rgb: [255,255,255] },
            ],
        });
    }

    if (containers[1]) {
        buildPendulum(containers[1], {
            arms: [
                { a1: Math.PI/2.5, a2: Math.PI/1.5, rgb: [255,255,255] },
            ],
        });
    }

    /* Twin comparison — same angle, velocity nudged by 0.001 rad/s on v1.
       Divergence becomes visible within ~3–5 seconds. */
    if (containers[2]) {
        buildPendulum(containers[2], {
            arms: [
                { a1: Math.PI/1.7, a2: Math.PI/2,               rgb: [255,255,255] },
                { a1: Math.PI/1.7, a2: Math.PI/2, v1: 0.015, rgb: [130,195,255] },
            ],
        });
    }

})();