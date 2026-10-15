// The movie, played by scrolling: the pattern page rises while its words fall off, the empty page tears in two,
// and the phone comes up with a long round in pieces that tick off as you keep going. Scrolling back rewinds it.
(function () {
  const movie = document.querySelector('.movie');
  if (!movie) return;
  const stage = movie.querySelector('.m-stage');
  const paper = movie.querySelector('.m-paper');
  const halves = { top: movie.querySelector('.half.top'), bottom: movie.querySelector('.half.bottom') };
  const phone = movie.querySelector('.m-phone');
  const screen = phone.querySelector('.screen');
  const done = movie.querySelector('.m-done');
  const hint = movie.querySelector('.m-hint');
  const pieces = [...phone.querySelectorAll('.pieces li')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const span = (a, b, p) => clamp((p - a) / (b - a));
  // A fixed sequence of "random" numbers, so the page falls apart the same way every time.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Every word, and every scribble, becomes something that can fall.
  const units = [];
  const UNIT = 'mark, s, i, .pencil, .q, .circle';
  function wrap(node) {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) frag.append(t);
          else { const w = document.createElement('span'); w.className = 'w'; w.textContent = t; frag.append(w); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.matches(UNIT)) n.classList.add('w');
      else if (n.nodeType === 1) wrap(n);
    });
  }
  paper.querySelectorAll('p').forEach(wrap);
  paper.querySelectorAll('.tally, .sticky, .page').forEach((el) => el.classList.add('w'));
  const all = [...paper.querySelectorAll('.w')];
  all.forEach((el, i) => {
    // Roughly top to bottom, a little out of order, like a page shedding its words.
    const t0 = clamp(0.14 + 0.25 * (i / all.length) + (rand() - 0.5) * 0.06, 0.12, 0.4);
    units.push({ el, t0, last: '' });
  });

  // Sizes and the torn edge, worked out again when the window changes.
  let vh = 0, W = 0, H = 0, x0 = 0, y0 = 0, y1 = 0, tearY = 0, edge = [];
  function measure() {
    vh = stage.clientHeight;
    W = paper.offsetWidth;
    H = paper.offsetHeight;
    x0 = -W / 2;
    y0 = vh * 0.12;
    y1 = Math.min(y0, vh * 0.85 - H);
    tearY = vh * 0.42 - y1;
    // The tear, as real paper rips: a wandering line with small ragged teeth and the odd bigger bite,
    // a white fibrous core that shows mostly on the top piece, and a few loose fibres.
    seed = 11;
    edge = [];
    const ph = [rand() * 6, rand() * 6, rand() * 6, rand() * 6];
    let walk = 0;
    for (let x = 0; x <= W + 2; x += 2) {
      walk = walk * 0.88 + (rand() - 0.5) * 1.8;
      // Small teeth on top of the wander, and every so often a tiny notch.
      let y = tearY + 11 * Math.sin(x * 0.009 + ph[0]) + 6 * Math.sin(x * 0.027 + ph[1]) + 2.5 * Math.sin(x * 0.083 + ph[2]) + walk + (rand() - 0.5) * 1.8;
      if (rand() < 0.04) y += (rand() - 0.3) * 4;
      const core = 1.5 + 3.8 * (0.5 + 0.5 * Math.sin(x * 0.045 + ph[3])) * (0.6 + 0.8 * rand());
      const fibre = rand() < 0.12 ? rand() * 3.5 : 0;
      edge.push({ x: Math.min(x, W), y, top: core + fibre, bottom: 0.6 + rand() * 1.4 });
    }
    // Now and then a bigger bite out of the edge.
    for (let i = 0; i < edge.length; i++) {
      if (rand() < 0.012) {
        const size = (rand() - 0.5) * 18, width = 6 + rand() * 10;
        for (let j = Math.max(0, i - 15); j < Math.min(edge.length, i + 15); j++) edge[j].y += size * Math.exp(-(((j - i) * 2) ** 2) / (2 * width * width));
      }
    }
    Object.values(halves).forEach((h) => { h.style.width = W + 'px'; h.style.height = H + 'px'; h.style.left = paper.offsetLeft + 'px'; });
    units.forEach((u) => (u.last = ''));
    update();
  }

  // Cut the two pieces along the edge. Behind the rip the edge shows its white core and a small gap;
  // ahead of it the paper still holds together.
  const clip = (el, pts) => { el.style.clipPath = `polygon(${pts.join(',')})`; };
  const layers = (h) => ({ face: h.querySelector('.face'), rim: h.querySelector('.rim'), shade: h.querySelector('.shade') });
  let topL, botL;
  function tearAt(front, apart) {
    topL = topL || layers(halves.top);
    botL = botL || layers(halves.bottom);
    const pts = { tf: [], tr: [], ts: [], bf: [], br: [], bs: [] };
    for (const e of edge) {
      const behind = clamp((front - e.x) / 60);
      const gap = (behind * 3 + clamp((front - e.x) / (W * 0.8)) * 5) * (1 - apart) + apart * 6;
      const open = Math.max(behind, apart);
      const ty = e.y - gap / 2, by = e.y + gap / 2;
      pts.tf.push(`${e.x}px ${ty}px`);
      pts.tr.push(`${e.x}px ${ty + e.top * open}px`);
      pts.ts.push(`${e.x}px ${ty + (e.top + 2.5) * open}px`);
      pts.bf.push(`${e.x}px ${by}px`);
      pts.br.push(`${e.x}px ${by - e.bottom * open}px`);
      pts.bs.push(`${e.x}px ${by - (e.bottom + 2.5) * open}px`);
    }
    const topOf = (a) => ['0 0', `${W}px 0`, ...a.reverse()];
    const bottomOf = (a) => [...a, `${W}px ${H}px`, `0 ${H}px`];
    clip(topL.face, topOf(pts.tf)); clip(topL.rim, topOf(pts.tr)); clip(topL.shade, topOf(pts.ts));
    clip(botL.face, bottomOf(pts.bf)); clip(botL.rim, bottomOf(pts.br)); clip(botL.shade, bottomOf(pts.bs));
  }

  function frame(p) {
    hint.style.opacity = 1 - span(0, 0.05, p);

    // 1. The page rises, and its words fall off.
    const y = y0 + (y1 - y0) * ease(span(0.02, 0.42, p));
    const torn = p >= 0.46;
    if (reduced) {
      paper.style.transform = `translate(${x0}px, ${y}px)`;
      paper.style.opacity = 1 - span(0.4, 0.5, p);
    } else {
      paper.style.transform = `translate(${x0}px, ${y}px)`;
      paper.style.visibility = torn ? 'hidden' : 'visible';
      units.forEach((u) => {
        const dt = p - u.t0;
        const fall = dt > 0 ? 0.5 * 760 * dt * dt * vh : 0;
        const t = fall ? `translateY(${fall}px)` : '';
        if (t !== u.last) {
          u.el.style.transform = t;
          // Fading as it drops, so the words left behind stay readable.
          u.el.style.opacity = fall ? Math.max(0, 1 - fall / (vh * 0.45)) : '';
          u.last = t;
        }
      });
    }

    // 2. The empty page rips from the left edge across, opening a little behind the rip, then the pieces part.
    const showHalves = !reduced && torn && p < 0.64;
    Object.values(halves).forEach((h) => (h.style.display = showHalves ? 'block' : 'none'));
    if (showHalves) {
      const front = ease(span(0.46, 0.53, p)) * (W + 40);
      const f = ease(span(0.53, 0.63, p));
      tearAt(front, f);
      halves.top.style.transform = `translate(${x0}px, ${y1 - f * vh * 0.8}px)`;
      halves.bottom.style.transform = `translate(${x0}px, ${y1 + f * vh * 0.85}px)`;
    }

    // 3. The phone rises into their place.
    const up = ease(span(0.55, 0.7, p));
    phone.style.transform = reduced ? 'none' : `translateY(${(1 - up) * 1.2 * vh}px)`;
    phone.style.opacity = reduced ? up : 1;
    done.style.opacity = ease(span(0.68, 0.75, p));
    done.style.transform = `translateY(calc(-50% + ${(1 - ease(span(0.68, 0.75, p))) * 16}px))`;

    // 4. The round, piece by piece, then on to the next round.
    const ticked = [0.74, 0.79, 0.84, 0.89].filter((t) => p >= t).length;
    pieces.forEach((li, i) => { li.classList.toggle('done', i < ticked); li.classList.toggle('now', i === ticked); });
    const round2 = p >= 0.94;
    screen.classList.toggle('ready', ticked === 4 && !round2);
    screen.classList.toggle('round2', round2);
    phone.querySelector('.c-label').textContent = round2 ? 'This round · 2 of 3' : 'This round · 1 of 3 · increase round';
    phone.querySelector('.c-togo').textContent = round2 ? '11 rounds to go' : '12 rounds to go';
    phone.querySelector('.c-total b').textContent = round2 ? '41' : '40';
  }

  function update() {
    const r = movie.getBoundingClientRect();
    frame(clamp(-r.top / (movie.offsetHeight - window.innerHeight)));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  document.fonts?.ready.then(measure);
  measure();
})();
