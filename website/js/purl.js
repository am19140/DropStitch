// Mrs Purl knits while you look around, nods off when you stop, and wakes up when you move.
// Same rig and motion as the app's PaintedKnittingGrandma, in plain JS.
(function () {
  const svg = document.querySelector('.purl-svg');
  if (!svg) return;
  const work = svg.querySelector('#pg-work-motion');
  const head = svg.querySelector('#pg-head-motion');
  const lids = svg.querySelector('#pg-lids');
  const thread = svg.querySelector('#pg-thread');
  const bubble = document.querySelector('.bubble');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const f = (x) => x.toFixed(3);
  const m = { sleep: 0, velocity: 0, phase: 0 };
  let target = 0;

  function advance(dt) {
    const w = reduced ? 13 : 4.3, y = m.sleep - target, j = m.velocity + w * y, c = Math.exp(-w * dt);
    m.sleep = target + (y + j * dt) * c;
    m.velocity = (m.velocity - w * j * dt) * c;
    if (Math.abs(m.sleep - target) < 0.00001 && Math.abs(m.velocity) < 0.00005) { m.sleep = target; m.velocity = 0; }
    m.phase += dt * 4.1 * Math.pow(Math.max(0, 1 - m.sleep), 1.6);
  }

  function draw() {
    const { sleep, phase } = m, a = reduced ? 0 : 1 - sleep, wave = Math.sin(phase), h = smooth(0.14, 0.98, sleep);
    const wx = 1.5 * wave * a, wy = 2.5 * Math.cos(phase) * a + 25 * sleep, wr = 1.15 * wave * a - 3 * sleep;
    const rad = (wr * Math.PI) / 180;
    const px = 535 + 75 * Math.cos(rad) - 37 * Math.sin(rad) + wx, py = 610 + 75 * Math.sin(rad) + 37 * Math.cos(rad) + wy;
    head.setAttribute('transform', `translate(${-4 * h} ${7 * h}) rotate(${-12 * h + 0.3 * wave * a} 608 441)`);
    work.setAttribute('transform', `translate(${f(wx)} ${f(wy)}) rotate(${f(wr)} 535 610)`);
    lids.setAttribute('opacity', smooth(0.38, 0.83, sleep));
    thread.setAttribute('d', `M${f(px)} ${f(py)} C601 718 653 746 682 760 C727 779 756 849 809 869 C855 899 887 849 914 873`);
  }

  // What she says: knitting, dozing, and pretending she wasn't.
  const LINES = {
    awake: ['Keep scrolling, dear. I’m counting.', 'Row 41. Or 42. The app knows.', 'Don’t mind me, nearly done with this sleeve.'],
    asleep: 'zzz…',
    woken: ['Oh! I wasn’t asleep.', 'Just resting my eyes.', 'Where were we? Oh yes, the app remembers.'],
  };
  let said = 0;
  const say = (text) => { if (bubble && bubble.textContent !== text) { bubble.textContent = text; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop'); } };

  let idle;
  const wake = () => {
    if (target === 1) say(LINES.woken[said++ % LINES.woken.length]);
    target = 0;
    clearTimeout(idle);
    idle = setTimeout(() => { target = 1; say(LINES.asleep); }, 7000);
  };
  ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, wake, { passive: true }));
  setInterval(() => { if (target === 0) say(LINES.awake[said++ % LINES.awake.length]); }, 6000);
  wake();
  say(LINES.awake[0]);

  // Only animate while she's on screen and the tab is open.
  let visible = true, frame = 0, last = 0;
  const tick = (now) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    advance(dt);
    draw();
    frame = requestAnimationFrame(tick);
  };
  const run = () => { cancelAnimationFrame(frame); last = 0; if (visible && !document.hidden) frame = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(svg);
  document.addEventListener('visibilitychange', run);
  draw();
  run();
})();
