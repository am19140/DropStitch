// The pattern book, played by scrolling: its pages bend and turn one by one, the last spread rips down the middle and the
// halves pull apart, then the phone comes up with a long round in pieces that tick off. Scrolling back rewinds it.
(function () {
  const movie = document.querySelector('.movie');
  if (!movie) return;
  const stage = movie.querySelector('.m-stage');
  const head = movie.querySelector('.m-head');
  const count = movie.querySelector('.m-count');
  const book = movie.querySelector('.book');
  const wrap = movie.querySelector('.book-wrap');
  const leaves = [...book.querySelectorAll('.leaf')];
  const pieces = { left: movie.querySelector('.half.top'), right: movie.querySelector('.half.bottom') };
  const phone = movie.querySelector('.m-phone');
  const screen = phone.querySelector('.screen');
  const done = movie.querySelector('.m-done');
  const rows = [...phone.querySelectorAll('.pieces li')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.matchMedia('(max-width: 760px)');

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const span = (a, b, p) => clamp((p - a) / (b - a));
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dimLayer = () => { const d = document.createElement('span'); d.className = 'dim'; return d; };

  // Chart A: a little colourwork grid, the same every time.
  const chart = book.querySelector('.chart');
  if (chart) {
    seed = 3;
    let cells = '';
    for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) {
      const on = (x + y) % 8 === 0 || (x - y + 16) % 8 === 0 || (y === 4 && x % 2 === 0) || rand() < 0.06;
      if (on) cells += `<rect x="${x * 5}" y="${y * 5}" width="5" height="5" fill="${y === 4 ? '#F51614' : '#034FC9'}"/>`;
    }
    let grid = '';
    for (let i = 0; i <= 16; i++) grid += `<path d="M${i * 5} 0V50" />`;
    for (let i = 0; i <= 10; i++) grid += `<path d="M0 ${i * 5}H80" />`;
    chart.innerHTML = `${cells}<g stroke="rgba(51,41,31,.35)" stroke-width=".35">${grid}</g>`;
  }

  // Each leaf: flat faces while it rests, and a bendable copy made of slices while it turns.
  const SLICES = 14;
  const leafParts = leaves.map((leaf) => {
    const [front, back] = leaf.querySelectorAll('.face');
    front.append(dimLayer());
    back.append(dimLayer());
    const curl = document.createElement('div');
    curl.className = 'curl';
    const segs = [];
    for (let i = 0; i < SLICES; i++) {
      const seg = document.createElement('div');
      seg.className = 'seg';
      const sf = document.createElement('div');
      sf.className = 'sf';
      const f = front.cloneNode(true);
      f.className = 'page right';
      f.querySelector('.dim')?.remove();
      sf.append(f, dimLayer());
      const sb = document.createElement('div');
      sb.className = 'sb';
      const b = back.cloneNode(true);
      b.className = 'page left';
      b.querySelector('.dim')?.remove();
      sb.append(b, dimLayer());
      seg.append(sf, sb);
      curl.append(seg);
      segs.push({ seg, sf, sb, f, b, fd: sf.lastChild, bd: sb.lastChild });
    }
    leaf.append(curl);
    return { leaf, front, back, curl, segs };
  });

  const turnShadow = document.createElement('div');
  turnShadow.className = 'turn-shadow';
  book.append(turnShadow);

  // When each page turns, as a share of the scroll through the section.
  const TURNS = [[0.08, 0.19], [0.22, 0.33], [0.36, 0.47]];

  // The last spread, flat, for the two torn pieces to carry.
  const lastLeft = leaves[leaves.length - 1].querySelector('.face.back');
  const lastRight = book.querySelector('.page.right.base');
  Object.values(pieces).forEach((h) => {
    const flat = document.createElement('div');
    flat.className = 'flat';
    const l = lastLeft.cloneNode(true);
    l.className = 'page left';
    l.querySelector('.dim')?.remove();
    flat.append(l, lastRight.cloneNode(true));
    h.querySelector('.face').append(flat);
  });

  let sw = 0, W = 0, H = 0, pw = 0, bx = 0, by = 0, edge = [], sliceW = 0;
  const OVERLAP = 1.6, EYE = 2600;
  const area = movie.querySelector('.m-area');
  function measure() {
    sw = stage.clientWidth;
    // The book takes the room left under the headline: as big as fits, never bigger than a real magazine.
    const room = area.clientHeight;
    const size = narrow.matches ? Math.min(330, sw * 0.84, (room - 16) / 1.32) : Math.min(440, sw * 0.42, (room - 34) / 1.32);
    stage.style.setProperty('--pw', `${Math.max(160, size).toFixed(1)}px`);
    W = book.offsetWidth;
    H = book.offsetHeight;
    pw = W / 2;
    const s = stage.getBoundingClientRect(), b = wrap.getBoundingClientRect();
    bx = b.left - s.left;
    by = b.top - s.top;

    // Slices: the part of the front and back page each one shows. Each reaches a little past both of its edges,
    // so the soft edges of neighbouring slices land on matching paper and no seam shows.
    sliceW = pw / SLICES;
    leafParts.forEach(({ segs }) => segs.forEach(({ seg, f, b }, i) => {
      seg.style.left = `${-OVERLAP}px`;
      seg.style.width = `${sliceW + 2 * OVERLAP}px`;
      seg.style.transformOrigin = `${OVERLAP}px 50%`;
      f.style.left = `${OVERLAP - i * sliceW}px`;
      b.style.left = `${sliceW + OVERLAP - pw + i * sliceW}px`;
    }));

    // The tear runs down the middle: through the spine, or through the middle of the one page a phone shows.
    const tearX = narrow.matches ? W * 0.75 : W / 2;
    seed = 11;
    edge = [];
    const ph = [rand() * 6, rand() * 6, rand() * 6, rand() * 6];
    let walk = 0;
    for (let y = 0; y <= H + 2; y += 2) {
      walk = walk * 0.88 + (rand() - 0.5) * 1.8;
      let x = tearX + 11 * Math.sin(y * 0.008 + ph[0]) + 6 * Math.sin(y * 0.026 + ph[1]) + 2.5 * Math.sin(y * 0.083 + ph[2]) + walk + (rand() - 0.5) * 1.8;
      if (rand() < 0.04) x += (rand() - 0.3) * 4;
      const core = 1.5 + 3.8 * (0.5 + 0.5 * Math.sin(y * 0.045 + ph[3])) * (0.6 + 0.8 * rand());
      edge.push({ y: Math.min(y, H), x, left: core + (rand() < 0.12 ? rand() * 3.5 : 0), right: 0.6 + rand() * 1.4 });
    }
    for (let i = 0; i < edge.length; i++) {
      if (rand() < 0.012) {
        const size = (rand() - 0.5) * 18, width = 6 + rand() * 10;
        for (let j = Math.max(0, i - 15); j < Math.min(edge.length, i + 15); j++) edge[j].x += size * Math.exp(-(((j - i) * 2) ** 2) / (2 * width * width));
      }
    }
    Object.values(pieces).forEach((h) => { h.style.width = W + 'px'; h.style.height = H + 'px'; });
    update();
  }

  const clip = (el, pts) => { el.style.clipPath = `polygon(${pts.join(',')})`; };
  const layers = (h) => ({ face: h.querySelector('.face'), rim: h.querySelector('.rim'), shade: h.querySelector('.shade') });
  let L, R;
  // The rip runs from the top down. Behind it the edge shows its white core and a small gap; ahead the paper still holds.
  function tearAt(front, apart) {
    L = L || layers(pieces.left);
    R = R || layers(pieces.right);
    const pts = { lf: [], lr: [], ls: [], rf: [], rr: [], rs: [] };
    for (const e of edge) {
      const behind = clamp((front - e.y) / 60);
      const gap = (behind * 3 + clamp((front - e.y) / (H * 0.8)) * 5) * (1 - apart) + apart * 6;
      const open = Math.max(behind, apart);
      const lx = e.x - gap / 2, rx = e.x + gap / 2;
      pts.lf.push(`${lx}px ${e.y}px`);
      pts.lr.push(`${lx + e.left * open}px ${e.y}px`);
      pts.ls.push(`${lx + (e.left + 2.5) * open}px ${e.y}px`);
      pts.rf.push(`${rx}px ${e.y}px`);
      pts.rr.push(`${rx - e.right * open}px ${e.y}px`);
      pts.rs.push(`${rx - (e.right + 2.5) * open}px ${e.y}px`);
    }
    const leftOf = (a) => ['0 0', ...a, `0 ${H}px`];
    const rightOf = (a) => [...a, `${W}px ${H}px`, `${W}px 0`];
    clip(L.face, leftOf(pts.lf)); clip(L.rim, leftOf(pts.lr)); clip(L.shade, leftOf(pts.ls));
    clip(R.face, rightOf(pts.rf)); clip(R.rim, rightOf(pts.rr)); clip(R.shade, rightOf(pts.rs));
  }

  let shownSpread = -1;
  function frame(p) {
    // 1. The pages bend and turn.
    let shadow = 0, turning = -1, turned = 0;
    leafParts.forEach(({ leaf, front, back, curl, segs }, k) => {
      const [a, b] = TURNS[k];
      let f = span(a, b, p);
      if (reduced) f = f < 0.5 ? 0 : 1;
      const e = ease(f);
      const moving = f > 0 && f < 1;
      if (e >= 0.5) turned += 1;
      if (moving) {
        turning = k;
        leaf.style.transform = 'none';
        leaf.style.zIndex = 50;
        front.style.visibility = back.style.visibility = 'hidden';
        curl.style.display = 'block';
        // The free edge leads a little, like a page lifted by its edge, so the page bends in a soft curve.
        const theta = -180 * e, bend = -55 * Math.sin(Math.PI * e);
        const angle = (x) => clamp(theta + bend * Math.pow(x, 1.4), -180, 0);
        // Light falls off smoothly across the curve: shade each slice from its start to its end, not in one flat step.
        const frontShade = (A) => 0.32 * Math.pow(Math.min(1, -A / 90), 1.3);
        const backShade = (A) => 0.28 * Math.max(0, (180 + A) / 90);
        const ink = (v) => `rgba(43,32,21,${v.toFixed(3)})`;
        // Each slice is placed on its own, hinged where the one before it ends, so the browser never has to nest 3D.
        let hx = 0, hz = 0;
        segs.forEach(({ seg, sf, sb, fd, bd }, i) => {
          const A = angle(i / (SLICES - 1));
          const A0 = angle(Math.max(0, i - 0.5) / (SLICES - 1)), A1 = angle(Math.min(SLICES - 1, i + 0.5) / (SLICES - 1));
          const r = (A * Math.PI) / 180;
          seg.style.transform = `translate3d(${hx.toFixed(2)}px, 0, ${hz.toFixed(2)}px) rotateY(${A.toFixed(2)}deg)`;
          // Which side you see: the front faces you when it points towards your eye, seen through the book's perspective.
          const cx = hx + (sliceW / 2) * Math.cos(r), cz = hz - (sliceW / 2) * Math.sin(r);
          const up = Math.sin(r) * -cx + Math.cos(r) * (EYE - cz) > 0;
          hx += sliceW * Math.cos(r);
          hz -= sliceW * Math.sin(r);
          sf.style.visibility = up ? 'visible' : 'hidden';
          sb.style.visibility = up ? 'hidden' : 'visible';
          if (up) fd.style.background = `linear-gradient(90deg, ${ink(frontShade(A0))}, ${ink(frontShade(A1))})`;
          else bd.style.background = `linear-gradient(270deg, ${ink(backShade(A0))}, ${ink(backShade(A1))})`;
        });
        if (e < 0.5) shadow = Math.max(shadow, Math.sin(e * Math.PI));
      } else {
        curl.style.display = 'none';
        leaf.style.transform = e >= 0.5 ? 'rotateY(-180deg)' : 'none';
        // Turned pages pile up on the left (last one on top), unturned ones on the right (first one on top).
        leaf.style.zIndex = e >= 0.5 ? 10 + k : 10 + (leaves.length - k);
        front.style.visibility = e < 0.5 ? 'visible' : 'hidden';
        back.style.visibility = e >= 0.5 ? 'visible' : 'hidden';
        front.querySelector('.dim').style.opacity = 0;
        back.querySelector('.dim').style.opacity = 0;
      }
    });
    turnShadow.style.opacity = shadow.toFixed(3);
    turnShadow.style.zIndex = turning >= 0 ? 10 + (leaves.length - turning - 1) : 0;
    if (turned !== shownSpread) {
      shownSpread = turned;
      count.textContent = `pages ${1 + 2 * turned}–${2 + 2 * turned} of 9`;
    }
    head.style.opacity = (1 - span(0.6, 0.66, p)).toFixed(3);

    // 2. The last spread rips down the middle, then the pieces pull apart.
    const torn = !reduced && p >= 0.52;
    wrap.style.opacity = reduced ? 1 - span(0.5, 0.58, p) : torn ? 0 : 1;
    wrap.style.visibility = torn ? 'hidden' : 'visible';
    const show = torn && p < 0.7;
    Object.values(pieces).forEach((h) => (h.style.display = show ? 'block' : 'none'));
    if (show) {
      const front = ease(span(0.52, 0.59, p)) * (H + 40);
      const f = ease(span(0.59, 0.69, p));
      tearAt(front, f);
      // Each half slides out past its side of the screen.
      const out = f * (window.innerWidth / 2 + W / 2);
      pieces.left.style.transform = `translate(${bx - out}px, ${by}px)`;
      pieces.right.style.transform = `translate(${bx + out}px, ${by}px)`;
    }

    // 3. The phone comes up into their place.
    const vh = stage.clientHeight;
    const up = ease(span(0.63, 0.76, p));
    phone.style.transform = reduced ? 'none' : `translateY(${(1 - up) * 1.2 * vh}px)`;
    phone.style.opacity = reduced ? up : 1;
    const d = ease(span(0.74, 0.8, p));
    done.style.opacity = d;
    done.style.transform = `translateY(calc(-50% + ${(1 - d) * 16}px))`;

    // 4. The round, piece by piece, then the next round.
    const ticked = [0.8, 0.84, 0.88, 0.92].filter((t) => p >= t).length;
    rows.forEach((li, i) => { li.classList.toggle('done', i < ticked); li.classList.toggle('now', i === ticked); });
    const round2 = p >= 0.95;
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
