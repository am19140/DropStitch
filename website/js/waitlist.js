// The waitlist. An email (and maybe the phone type) goes into Supabase's `waitlist` table.
// The site can only add rows, never read them; Mariana reads the list in the Supabase dashboard.
// Anywhere but dropstitch.io (a mockup, a local preview) it only pretends, so nothing is sent.
(function () {
  var boxes = document.querySelectorAll('.wl');
  if (!boxes.length) return;

  var PRETEND = !/^(www\.)?dropstitch\.io$/.test(location.hostname);
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function post(path, body) {
    if (PRETEND) return new Promise(function (resolve) { setTimeout(resolve, 500); });
    var cfg = window.DROPSTITCH;
    return fetch(cfg.supabaseUrl + '/rest/v1/' + path, {
      method: 'POST',
      headers: { apikey: cfg.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body)
    }).then(function (res) {
      // 409: this email is already on the list, which is fine.
      if (!res.ok && res.status !== 409) throw new Error(path + ' ' + res.status);
    });
  }
  function join(email, phone) { return post('waitlist', phone ? { email: email, phone: phone } : { email: email }); }
  // Fills in the phone only while it's still empty, so nobody can change someone else's.
  function addPhone(email, phone) { return post('rpc/waitlist_phone', { p_email: email, p_phone: phone }); }

  boxes.forEach(function (box) {
    var form = box.querySelector('form');
    var step2 = box.querySelector('.wl-step2');
    var done = box.querySelector('.wl-done');
    var msg = form.querySelector('.wl-msg');
    var button = form.querySelector('.wl-go');
    var label = button.innerHTML;
    var email = '';

    function say(text) { msg.textContent = text; msg.hidden = !text; }
    function show(panel) {
      [form, step2, done].forEach(function (p) { if (p) p.hidden = p !== panel; });
      panel.focus();
    }

    form.addEventListener('change', function () { say(''); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var picker = form.querySelector('.wl-phone');
      var picked = form.querySelector('input[name="phone"]:checked');
      email = form.elements.email.value.trim().toLowerCase();
      if (form.elements.website.value) return show(done); // only bots fill the hidden field
      if (picker && !picked) return say('Pick iPhone or Android first.');
      if (!EMAIL.test(email)) return say('That email doesn’t look quite right.');

      say('');
      button.disabled = true;
      button.textContent = 'Joining…';
      join(email, picked && picked.value).then(function () {
        show(step2 || done);
      }, function () {
        button.disabled = false;
        button.innerHTML = label;
        say('Something went wrong. Try again, or write to hello@dropstitch.io.');
      });
    });

    if (step2) {
      step2.addEventListener('click', function (event) {
        var tile = event.target.closest('[data-phone]');
        if (event.target.closest('.wl-skip')) return show(done);
        if (!tile) return;
        // They're on the list already; a missing phone is no reason to bother them.
        addPhone(email, tile.dataset.phone).then(function () { show(done); }, function () { show(done); });
      });
    }
  });
})();
