/* ═══════════════════════════════════════════
   COVER ENTRANCE
   Fires immediately on load with a small delay
   so the browser has painted before transitions.
   ═══════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {
    const coverIds = [
        'cover-rule',
        'cover-pretitle',
        'cover-title',
        'cover-subtitle',
        'cover-rule-bottom',
        'cover-scroll-hint',
    ];

    setTimeout(() => {
        coverIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('visible');
        });
    }, 120);
});


/* ═══════════════════════════════════════════
   TYPEWRITER
   ═══════════════════════════════════════════ */

function typewriter(el, text, speed = 80, onDone) {
    el.classList.add('typewriter-cursor');
    let i = 0;
    const tick = () => {
        el.textContent = text.slice(0, ++i);
        if (i < text.length) {
            setTimeout(tick, speed);
        } else {
            el.classList.remove('typewriter-cursor');
            if (onDone) onDone();
        }
    };
    tick();
}


/* ═══════════════════════════════════════════
   NUMBER REVEAL (0.000127)
   Build digit spans on load, reveal on scroll.
   ═══════════════════════════════════════════ */

const numEl = document.getElementById('number-reveal');
'0.000127'.split('').forEach(ch => {
    const span = document.createElement('span');
    span.className = 'digit';
    span.textContent = ch;
    numEl.appendChild(span);
});


/* ═══════════════════════════════════════════
   CENTERED INTERSECTION OBSERVER
   Used for elements that should only trigger
   when they are well into the viewport (0.5).
   ═══════════════════════════════════════════ */

function watchCentred(el, cb) {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                cb();
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    obs.observe(el);
}


/* ═══════════════════════════════════════════
   PER-ELEMENT ON-VISIBLE CALLBACKS
   Assigned before the main observer is set up.
   ═══════════════════════════════════════════ */

// "Trustworthy." typewriter
const trustEl = document.getElementById('trustworthy-text');
watchCentred(trustEl.closest('.fade-in'), () => {
    setTimeout(() => typewriter(trustEl, 'Trustworthy.', 90), 400);
});

// "Chaos Theory" typewriter
const chaosEl = document.getElementById('chaos-text');
chaosEl.closest('.bg-media-wrap')._onVisible = () => {
    setTimeout(() => typewriter(chaosEl, 'Chaos Theory', 100), 300);
};

// 0.000127 digit reveal
const numWrap = document.getElementById('number-reveal-wrap');
watchCentred(numWrap.closest('.fade-in'), () => {
    numEl.querySelectorAll('.digit').forEach((span, i) => {
        setTimeout(() => span.classList.add('shown'), 600 + i * 120);
    });
});

// Lorenz image slide + wipe
const lorenzImg = document.getElementById('lorenz-img');
lorenzImg.closest('.fade-in')._onVisible = () => {
    setTimeout(() => lorenzImg.classList.add('visible'), 200);
};


/* ═══════════════════════════════════════════
   MAIN SCROLL OBSERVER
   Must be set up AFTER the _onVisible callbacks
   above, so they are ready when elements fire.
   ═══════════════════════════════════════════ */

function reveal(el) {
    el.classList.add('visible');
    if (el._onVisible) el._onVisible();
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.4 });

// Wait 900ms before watching — lets the cover animation play
// and orients the user before scroll animations begin.
// Elements already in view are staggered by vertical position
// so they cascade top-to-bottom instead of all popping at once.
setTimeout(() => {
    const els = Array.from(document.querySelectorAll('.fade-in, .divider'));
    els.forEach(el => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
            const stagger = Math.round((rect.top / window.innerHeight) * 600);
            setTimeout(() => reveal(el), stagger);
        } else {
            observer.observe(el);
        }
    });
}, 900);

/* ═══════════════════════════════════════════
   BACK TO TOP BUTTON
   Fades in after scrolling 40% of the page.
   Fixed to bottom-left, unobtrusive.
   ═══════════════════════════════════════════ */

(function () {
    const btn = document.createElement('button');
    btn.textContent = '↑';
    btn.setAttribute('aria-label', 'Back to top');
    Object.assign(btn.style, {
        position:       'fixed',
        bottom:         '2rem',
        left:           '2rem',
        zIndex:         '100',
        background:     'transparent',
        border:         '2px solid rgba(255,255,255,0.5)',
        color:          'rgba(255,255,255,0.5)',
        fontSize:       '0.85rem',
        width:          '2.2rem',
        height:         '2.2rem',
        borderRadius:   '50%',
        cursor:         'pointer',
        opacity:        '0',
        transition:     'opacity 0.5s ease, color 0.2s, border-color 0.2s',
        pointerEvents:  'none',
        lineHeight:     '1',
    });

    btn.addEventListener('mouseenter', () => {
        btn.style.color       = 'rgba(255,255,255)';
        btn.style.borderColor = 'rgba(255,255,255)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.color       = 'rgba(255,255,255,0.5)';
        btn.style.borderColor = 'rgba(255,255,255,0.5)';
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrolled > 0.15) {
            btn.style.opacity      = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity      = '0';
            btn.style.pointerEvents = 'none';
        }
    }, { passive: true });
})();