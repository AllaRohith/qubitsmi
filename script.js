/* ═══════════════════════════════════════════════════════════════
   QUBITSEMI SOLUTIONS — Script
   Single-button theme toggle (☼/☾), scroll progress,
   nav active state, training tabs, contact form, year stamp.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  const KEY = 'qsmi-theme';
  const root = document.documentElement;

  /* ── THEME TOGGLE (Sun/Moon single-button) ─────────────────── */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    // match --bg so the browser chrome blends with the masthead
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#060c1a' : '#ffffff');

    // icon visibility is driven by CSS from [data-theme]
    const dark = theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const label = btn.querySelector('.theme-label');
      if (label) label.textContent = dark ? 'Dark' : 'Light';
      // name contains the visible text; describes state + action (no aria-pressed)
      btn.setAttribute('aria-label', dark ? 'Dark theme, switch to light' : 'Light theme, switch to dark');
      btn.removeAttribute('aria-pressed');
    });
  }

  // Resolve initial theme: localStorage > prefers-color-scheme > light
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved !== 'light' && saved !== 'dark') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      saved = 'dark';
    } else {
      saved = 'light';
    }
  }
  applyTheme(saved);

  // Wire all toggle pills
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}

      // Pulse + glass-flash feedback on toggle
      btn.classList.remove('toggling');
      void btn.offsetWidth; // restart animation
      btn.classList.add('toggling');
      setTimeout(() => btn.classList.remove('toggling'), 700);

      // Brief flash on glass cards
      document.body.classList.remove('theme-changed');
      void document.body.offsetWidth;
      document.body.classList.add('theme-changed');
      setTimeout(() => document.body.classList.remove('theme-changed'), 900);
    });
  });

  // Live-track OS theme, but only when user has no explicit preference saved
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      let stored = null;
      try { stored = localStorage.getItem(KEY); } catch (err) {}
      if (stored) return;
      applyTheme(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  /* ── ACTIVE NAV STATE ──────────────────────────────────────── */
  (function markActiveNav() {
    // normalise so '/', '/index', '/index.html' and '/solutions' all compare cleanly
    const norm = (p) => (p.split('#')[0].split('?')[0].split('/').pop() || 'index').toLowerCase().replace(/\.html$/, '');
    const here = norm(window.location.pathname);
    document.querySelectorAll('.masthead-nav a, .nav-drawer a, .footprint li a').forEach((a) => {
      const raw = a.getAttribute('href') || '';
      if (raw.indexOf('#') !== -1 || raw.indexOf(':') !== -1) return; // skip deep links / mailto
      if (norm(raw) === here) {
        a.classList.add('active');
        if (!a.closest('.footprint')) a.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ── MOBILE NAV · drawer open/close, focus mgmt, scroll lock ── */
  (function mobileNav() {
    const burger = document.querySelector('[data-nav-toggle]');
    const drawer = document.querySelector('[data-nav-drawer]');
    if (!burger || !drawer) return;
    const scrim = document.querySelector('[data-nav-scrim]');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Site menu');
    // everything behind the scrim is taken out of focus order while the drawer is open
    const behind = Array.from(document.querySelectorAll('.skip-link, main, footer, [data-sticky-cta]'));

    function setOpen(open) {
      const wasOpen = root.classList.contains('nav-open');
      // scroll lock lives in CSS (html.nav-open) — the root is the scroller
      root.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      behind.forEach((el) => { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
      if (open && !wasOpen) {
        const first = drawer.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      } else if (!open && wasOpen && (drawer.contains(document.activeElement) || document.activeElement === document.body)) {
        burger.focus({ preventScroll: true });
      }
    }

    burger.addEventListener('click', () => {
      setOpen(!root.classList.contains('nav-open'));
    });
    if (scrim) scrim.addEventListener('click', () => setOpen(false));
    // close on any drawer link click
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('nav-open')) setOpen(false);
    });
    // if we resize up to desktop, ensure the drawer doesn't stay latched open
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && root.classList.contains('nav-open')) setOpen(false);
    });
  })();

  /* ── SCROLL PROGRESS BAR ───────────────────────────────────── */
  (function scrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    let pending = false;
    function update() {
      pending = false;
      const y = window.scrollY;
      const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.max(0, (y / docH) * 100));
      bar.style.width = pct.toFixed(2) + '%';
    }
    function onScroll() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* ── TABS (training page) · ARIA tabs, arrow keys, #hash deep link ── */
  (function initTabs() {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    if (!tabs.length) return;

    function select(tab, focus) {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      document.querySelectorAll('.tab-panel').forEach((p) => {
        p.classList.toggle('active', p.dataset.panel === target);
      });
      if (focus) tab.focus();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        select(tab, false);
        // shareable URL (training.html#de) without jumping the page
        if (history.replaceState) history.replaceState(null, '', '#' + tab.dataset.tab);
      });
      tab.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });

    function syncHash() {
      const fromHash = tabs.find((t) => '#' + t.dataset.tab === window.location.hash);
      if (fromHash) select(fromHash, false);
    }
    syncHash();
    // in-page links to #ai / #de switch the track too, not just scroll
    window.addEventListener('hashchange', syncHash);
  })();

  /* ── CONTACT FORM · validation + delivery ──────────────────── */
  (function formHandler() {
    // Set to a form backend URL (Formspree, Netlify Forms, own API) to POST briefs.
    // While empty, a valid brief opens the visitor's email app pre-filled instead.
    const FORM_ENDPOINT = '';
    const MAILTO = 'sales@qubitsemisolutions.com'; // business & training enquiries (careers@ is for careers)
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const MESSAGES = {
      name: 'Enter your name',
      email: 'Enter your email address',
      practice: 'Choose a practice',
      brief: 'Describe the scope in a sentence or two',
    };
    let errSeq = 0;
    function fieldError(input, msg) {
      const label = input.closest('label') || input.parentElement;
      let err = label.querySelector('.field-error');
      if (msg) {
        if (!err) {
          err = document.createElement('span');
          err.className = 'field-error';
          err.id = 'field-error-' + (++errSeq);
          label.appendChild(err);
        }
        err.textContent = msg;
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', err.id);
      } else {
        if (err) err.remove();
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
    function validate(input) {
      const v = (input.value || '').trim();
      if (input.hasAttribute('required') && !v) { fieldError(input, MESSAGES[input.name] || 'This field is required'); return false; }
      if (input.type === 'email' && v && !EMAIL_RE.test(v)) { fieldError(input, 'Enter a valid email, like you@company.com'); return false; }
      fieldError(input, null);
      return true;
    }
    function showStatus(sent, html) {
      if (!sent) return;
      sent.classList.add('form-ok');
      sent.innerHTML = html;
      sent.hidden = false;
    }

    document.querySelectorAll('form.form').forEach((f) => {
      const fields = f.querySelectorAll('input, textarea, select');
      fields.forEach((el) => {
        el.addEventListener('blur', () => { if (el.value.trim() || el.hasAttribute('required')) validate(el); });
        el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
      });

      f.addEventListener('submit', (e) => {
        e.preventDefault();
        let ok = true, firstBad = null;
        fields.forEach((el) => { if (!validate(el)) { ok = false; if (!firstBad) firstBad = el; } });
        if (!ok) { if (firstBad) firstBad.focus(); return; }

        const btn = f.querySelector('button[type="submit"]');
        const sent = f.querySelector('.sent');
        const data = new FormData(f);

        if (!FORM_ENDPOINT) {
          // no backend wired yet: hand the brief to the visitor's mail client (honest, nothing is lost)
          const subject = 'Project brief · ' + (data.get('practice') || 'General') + ' · ' + (data.get('name') || '');
          const body = [
            'Name: ' + (data.get('name') || ''),
            'Email: ' + (data.get('email') || ''),
            'Organisation: ' + (data.get('org') || '—'),
            'Practice: ' + (data.get('practice') || ''),
            '',
            data.get('brief') || '',
          ].join('\n');
          if (window.QSMail) {
            window.QSMail.show({ to: MAILTO, subject: subject, body: body, note: 'Your brief is ready — choose how to send it.' });
          } else {
            window.location.href = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
          }
          showStatus(sent, '<b>// brief ready</b><br>Choose how to send it to ' + MAILTO + ' (Gmail, Outlook, your email app, or copy it).');
          return;
        }

        if (btn) btn.setAttribute('aria-disabled', 'true');
        fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then((r) => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            f.reset();
            showStatus(sent, '<b>// brief received</b><br>Thank you — we will be in touch.');
          })
          .catch(() => {
            showStatus(sent, '<b>// could not send</b><br>Please email ' + MAILTO + ' directly — your text is still in the form.');
          })
          .finally(() => { if (btn) btn.removeAttribute('aria-disabled'); });
      });
    });
  })();

  /* ── STICKY MOBILE CTA · show past hero, hide over footer ────── */
  (function stickyCta() {
    const bar = document.querySelector('[data-sticky-cta]');
    if (!bar) return;
    const hero = document.querySelector('.hero, .hv2-hero, .hv2-page-hero');
    const footer = document.querySelector('footer');
    let footerVisible = false;
    let pending = false;
    function update() {
      pending = false;
      const trigger = hero ? hero.offsetHeight * 0.7 : 400;
      bar.classList.toggle('show', window.scrollY > trigger && !footerVisible);
    }
    // hide whenever any part of the footer is on screen, so the bar never covers it
    if (footer && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        footerVisible = entries[0].isIntersecting;
        update();
      }).observe(footer);
    }
    function onScroll() { if (pending) return; pending = true; requestAnimationFrame(update); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* ── YEAR STAMP ────────────────────────────────────────────── */
  (function yearStamp() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  })();

  /* ── PAGE LOAD · fade-in body ──────────────────────────────── */
  function markLoaded() { document.body.classList.add('loaded'); }
  if (document.readyState === 'complete') markLoaded();
  else window.addEventListener('load', markLoaded);
  // Safety in case 'load' is delayed by slow fonts/images
  setTimeout(markLoaded, 1500);

  /* ── SCROLL REVEAL · IntersectionObserver ───────────────────── */
  (function revealOnScroll() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  })();

  /* ── 3D CHIP + STACK STORY (home) ─────────────────────────────
     Hero: the chip tilts toward the pointer and its layers ease apart
     on scroll. Story mode (tall-enough screens): the chip moves into
     the sticky "Inside the stack" stage, glides to the middle, then
     the layers peel off top-down — qubits, die, package, board — each
     with its explanation card, before the next section scrolls in. */
  (function chipStory() {
    const chip = document.querySelector('[data-chip3d]');
    if (!chip || !window.matchMedia) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scene = document.querySelector('[data-story]');
    const hero = scene && scene.querySelector('.hv2-hero');
    const story = scene && scene.querySelector('.hv2-story');
    const stage = story && story.querySelector('[data-story-stage]');
    const inner = story && story.querySelector('.hv2-story-inner');
    const head = story && story.querySelector('.hv2-story-head');
    const list = story && story.querySelector('.hv2-story-steps');
    const track = scene && scene.querySelector('.hv2-story-track');
    const steps = story ? Array.from(story.querySelectorAll('.hv2-story-step')) : [];
    const dots = story ? Array.from(story.querySelectorAll('.hv2-story-dots span')) : [];
    const fig = chip.closest('figure');
    const mast = document.querySelector('.masthead');
    const LAYERS = ['q', 'die', 'pkg', 'board'];
    const REST = 0.85;
    const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    let live = false;
    let slot = null;
    let geo = null;

    function setSeps(a, b, c) {
      chip.style.setProperty('--sep1', a.toFixed(3));
      chip.style.setProperty('--sep2', b.toFixed(3));
      chip.style.setProperty('--sep3', c.toFixed(3));
    }
    function setTags(board, pkg, die, q) {
      [board, pkg, die, q].forEach((v, i) => chip.style.setProperty('--tag' + i, clamp(v).toFixed(3)));
    }

    function canLive() {
      return !!(story && stage && track && hero && fig && steps.length === 4) &&
        window.innerHeight >= 560 && document.documentElement.clientWidth >= 320;
    }

    function enable() {
      if (live) return;
      live = true;
      slot = document.createElement('div');
      slot.className = 'hv2-die hv2-die-slot';
      slot.setAttribute('aria-hidden', 'true');
      slot.style.height = fig.offsetHeight + 'px';
      fig.replaceWith(slot);
      stage.appendChild(fig);
      // switch layouts without animating the cards out of the static grid
      scene.classList.add('is-live', 'is-settling');
      measure();
      requestAnimationFrame(() => requestAnimationFrame(() => scene.classList.remove('is-settling')));
    }
    function disable() {
      if (!live) return;
      live = false;
      slot.replaceWith(fig);
      slot = null;
      scene.classList.remove('is-live');
      document.documentElement.classList.remove('story-active');
      fig.style.transform = '';
      fig.style.width = '';
      chip.removeAttribute('data-active');
      steps.forEach((el) => el.classList.remove('is-on'));
    }

    function measure() {
      if (!live) return;
      const vh = window.innerHeight;
      const figW = slot.offsetWidth;
      fig.style.width = figW + 'px';
      const figH = fig.offsetHeight;
      slot.style.height = figH + 'px';
      const heroH = hero.offsetHeight;
      scene.style.setProperty('--hero-h', heroH + 'px');
      scene.style.setProperty('--mast-h', (mast ? mast.offsetHeight : 0) + 'px');
      const moveLen = Math.max(vh * 0.6, heroH * 0.7);
      const stepLen = vh * 0.8;
      const hold = vh * 0.5;
      const total = moveLen + 4 * stepLen + hold;
      track.style.height = Math.round(total + vh) + 'px';
      geo = { figW, figH, moveLen, stepLen, total };
    }

    // where the chip sits once it reaches the middle (stage coords,
    // so it scrolls away with the stage when the pin releases)
    function target(st) {
      const mastH = mast ? mast.offsetHeight : 0;
      const ir = inner.getBoundingClientRect();
      const lr = list.getBoundingClientRect();
      const headVisible = head && getComputedStyle(head).display !== 'none';
      const top = (headVisible ? head.getBoundingClientRect().bottom - st.top : mastH) + 4;
      let l, r, t, b;
      if (document.documentElement.clientWidth > 980) {
        l = ir.left - st.left; r = lr.left - st.left - 24; t = top; b = st.height - 36;
      } else {
        const tallest = Math.max.apply(null, steps.map((el) => el.offsetHeight));
        l = ir.left - st.left; r = ir.right - st.left; t = top; b = st.height - 16 - tallest - 8;
      }
      // the 3D object fills ~90% of the figure box; the caption fades out
      const k = Math.min(1.2, (r - l) / geo.figW, (b - t) / (geo.figH * 0.9));
      return { cx: (l + r) / 2, cy: (t + b) / 2, k: Math.max(0.5, k) };
    }

    function heroOnly() {
      const r = chip.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.6 - (r.top + r.height / 2)) / (vh * 0.4));
      const v = REST + p * 0.55;
      setSeps(v, v, v);
    }

    let pending = false;
    function frame() {
      pending = false;
      if (!live) { heroOnly(); return; }
      const vh = window.innerHeight;
      const sr = scene.getBoundingClientRect();
      const s = clamp(-sr.top, 0, geo.total);

      // 1 · glide from the hero slot to the middle, assembling on the way
      const e = ease(clamp(s / geo.moveLen));
      const st = stage.getBoundingClientRect();
      const tg = target(st);
      const fr = slot.getBoundingClientRect();
      const fx = fr.left + fr.width / 2 - st.left;
      const fy = fr.top + fr.height / 2 - st.top;
      const cx = fx + (tg.cx - fx) * e;
      const cy = fy + (tg.cy - fy) * e;
      const k = 1 + (tg.k - 1) * e;
      fig.style.transform = 'translate3d(' + (cx - geo.figW / 2).toFixed(1) + 'px,' +
        (cy - geo.figH / 2).toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')';
      scene.style.setProperty('--story-e', e.toFixed(3));
      story.style.setProperty('--story-bg', clamp((e - 0.3) / 0.5).toFixed(3));
      story.style.setProperty('--story-head', clamp((e - 0.55) / 0.45).toFixed(3));

      // 2 · peel the layers off one at a time
      const a = s - geo.moveLen;
      const u = [0, 1, 2, 3].map((i) => ease(clamp((a - i * geo.stepLen) / (geo.stepLen * 0.55))));
      const base = REST * (1 - e);
      setSeps(Math.max(base, u[2] * 0.95), Math.max(base, u[1] * 1.05), Math.max(base, u[0] * 1.2));
      const fade = 1 - e * 1.6;
      setTags(Math.max(fade, u[3]), Math.max(fade, u[2]), Math.max(fade, u[1]), Math.max(fade, u[0]));

      const active = a < 0 ? -1 : Math.min(3, Math.floor(a / geo.stepLen));
      steps.forEach((el, i) => el.classList.toggle('is-on', i === active));
      dots.forEach((d, i) => d.classList.toggle('on', i <= active));
      if (active >= 0) chip.setAttribute('data-active', LAYERS[active]);
      else chip.removeAttribute('data-active');
      document.documentElement.classList.toggle('story-active', s > 0 && s < geo.total && sr.bottom > vh * 0.5);
    }
    function onScroll() { if (pending) return; pending = true; requestAnimationFrame(frame); }

    // "Look inside the stack": in story mode jump to where the chip is centred
    document.querySelectorAll('[data-story-jump]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        if (!live || !geo) return;
        ev.preventDefault();
        const top = scene.getBoundingClientRect().top + window.scrollY + geo.moveLen + geo.stepLen * 0.35;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });

    function sync() {
      if (canLive()) { enable(); measure(); } else disable();
      frame();
    }
    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { sync(); });
    window.addEventListener('load', sync);
    // web fonts and the opening scene can change the hero's size: re-measure
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    if (hero && 'ResizeObserver' in window) {
      let pendingSync = false;
      new ResizeObserver(() => {
        if (pendingSync) return;
        pendingSync = true;
        requestAnimationFrame(() => { pendingSync = false; sync(); });
      }).observe(hero);
    }

    // tilt toward the pointer (mouse / trackpad only)
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const zone = scene || chip.closest('section') || chip;
    const unit = (v) => Math.max(-1, Math.min(1, v));
    zone.addEventListener('pointermove', (ev) => {
      const r = chip.getBoundingClientRect();
      chip.style.setProperty('--tx', unit((ev.clientX - (r.left + r.width / 2)) / (r.width * 0.75)).toFixed(3));
      chip.style.setProperty('--ty', unit((ev.clientY - (r.top + r.height / 2)) / (r.height * 0.75)).toFixed(3));
    });
    zone.addEventListener('pointerleave', () => {
      chip.style.setProperty('--tx', '0');
      chip.style.setProperty('--ty', '0');
    });
  })();

  /* ── MASTHEAD · shadow on scroll ────────────────────────────── */
  (function mastheadScroll() {
    const mast = document.querySelector('.masthead');
    if (!mast) return;
    let pending = false;
    function check() {
      pending = false;
      mast.classList.toggle('scrolled', window.scrollY > 8);
    }
    function onScroll() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(check);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
  })();
})();

/* ── Registration pop-up ─────────────────────────────────────────────
   Home: shown on every visit to the page (including when navigating back to it from another page).
   Other pages: shown until the visitor closes it, then not again for the rest of that browser session.
   Once someone has registered (submitted the form / followed Register) it stops everywhere for the session.
   Add ?promo to any URL to force it.
   It lists the training programmes; "Register" opens the registration form straight away.
   - REGISTER_URL set  → Register buttons open the client's own form (new tab).
   - REGISTER_URL empty → the form opens inside the pop-up; PROMO_ENDPOINT (if set) receives it,
     otherwise it is drafted as an email to sales@. */
(function () {
  const REGISTER_URL = '';            // e.g. 'https://forms.zoho.in/…' — the client's registration form, when they send it
  const PROMO_ENDPOINT = '';          // optional: POST target (Zoho Forms, Formspree, a Catalyst function…)
  const MAILTO = 'sales@qubitsemisolutions.com';
  const CLOSED_KEY = 'qsmi-promo-closed';   // closed on a non-Home page
  const DONE_KEY = 'qsmi-promo-done';       // registered this session
  const isHome = /(^|\/)(index\.html)?$/.test(location.pathname);
  const markDone = () => { try { sessionStorage.setItem(DONE_KEY, '1'); } catch (e) {} };
  const forced = /[?&]promo\b/.test(location.search);       // add ?promo to any URL to preview it

  const PROGRAMMES = [
    { id: 'quantum', n: '01', title: 'Quantum Technologies', sub: 'Computing, communication, QML and quantum semiconductors',
      tags: ['Quantum computing', 'Quantum communication', 'Quantum ML', 'Quantum semiconductors'] },
    { id: 'ai', n: '02', title: 'Agentic AI, Generative AI & ML', sub: 'Python to LLMs, RAG, AI agents and MLOps',
      tags: ['LLMs', 'RAG', 'LangChain', 'LangGraph', 'CrewAI', 'MLOps'] },
    { id: 'de', n: '03', title: 'Data Engineering', sub: 'Azure Data Factory, Databricks and Snowflake',
      tags: ['Azure ADF', 'Databricks', 'PySpark', 'Snowflake'] }
  ];

  if (document.body.classList.contains('nf')) return;      // not on the 404 page
  try { localStorage.removeItem('qsmi-promo'); } catch (e) {}   // old key from earlier versions
  try {
    if (!forced) {
      if (sessionStorage.getItem(DONE_KEY)) return;
      if (!isHome && sessionStorage.getItem(CLOSED_KEY)) return;
    }
  } catch (e) {}

  const external = /^https?:\/\//i.test(REGISTER_URL);
  const root = document.documentElement;
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let box, opener, onKey;

  function regButton(p, label) {
    return external
      ? '<a class="promo-go" href="' + REGISTER_URL + '" target="_blank" rel="noopener">' + label + ' <span aria-hidden="true">→</span></a>'
      : '<button type="button" class="promo-go" data-reg="' + (p ? p.id : '') + '">' + label + ' <span aria-hidden="true">→</span></button>';
  }

  function build() {
    box = document.createElement('div');
    box.className = 'promo';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'promo-title');
    const cards = PROGRAMMES.map((p) =>
      '<article class="promo-prog">' +
        '<p class="promo-prog-n">' + p.n + '</p>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p class="promo-prog-sub">' + esc(p.sub) + '</p>' +
        '<ul class="promo-prog-tags" aria-label="Topics">' + p.tags.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
        regButton(p, 'Register') +
      '</article>').join('');
    const opts = PROGRAMMES.map((p) => '<option value="' + p.id + '">' + esc(p.title) + '</option>').join('');
    box.innerHTML =
      '<div class="promo-scrim" data-promo-close></div>' +
      '<div class="promo-card" role="document">' +
        '<button type="button" class="promo-x" data-promo-close aria-label="Close">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<div class="promo-head">' +
          '<div class="promo-art" aria-hidden="true"><span class="promo-ring r1"><i></i></span><span class="promo-ring r2"><i></i></span><span class="promo-ring r3"><i></i></span><span class="promo-core"><b>Q</b></span></div>' +
          '<p class="promo-badge"><span aria-hidden="true"></span>Registrations open</p>' +
          '<h2 id="promo-title">Learn. Build. <em>Innovate.</em></h2>' +
          '<p class="promo-p">Industry-ready, hands-on training — real use cases and capstone projects. Pick a programme and register.</p>' +
        '</div>' +
        '<div class="promo-view" data-view="programs">' +
          '<div class="promo-progs">' + cards + '</div>' +
          '<div class="promo-foot"><button type="button" class="promo-no" data-promo-close>Maybe later</button></div>' +
        '</div>' +
        '<div class="promo-view" data-view="form" hidden>' +
          '<button type="button" class="promo-back" data-back>← All programmes</button>' +
          '<form class="promo-form" novalidate>' +
            '<div class="promo-row"><label>Full name<input name="name" autocomplete="name" required></label>' +
            '<label>Phone<input name="phone" type="tel" autocomplete="tel" required></label></div>' +
            '<div class="promo-row"><label>Email<input name="email" type="email" autocomplete="email" required></label>' +
            '<label>Programme<select name="programme" required>' + opts + '</select></label></div>' +
            '<label><span>Organisation / college <em class="promo-opt">(optional)</em></span><input name="org" autocomplete="organization"></label>' +
            '<p class="promo-status" role="status" aria-live="polite"></p>' +
            '<div class="promo-foot"><button type="submit" class="promo-go">Submit registration <span aria-hidden="true">→</span></button>' +
            '<button type="button" class="promo-no" data-promo-close>Cancel</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);
  }

  function show(view, focusEl) {
    box.querySelectorAll('.promo-view').forEach((v) => { v.hidden = v.dataset.view !== view; });
    box.querySelector('.promo-card').classList.toggle('is-form', view === 'form');
    box.querySelector('.promo-card').scrollTop = 0;
    if (focusEl) focusEl.focus({ preventScroll: true });
  }

  function close() {
    if (!box) return;
    try { sessionStorage.setItem(CLOSED_KEY, '1'); } catch (e) {}
    box.classList.remove('is-open');
    root.classList.remove('promo-lock');
    document.removeEventListener('keydown', onKey);
    const gone = box;
    box = null;
    setTimeout(() => gone.remove(), 260);
    if (opener && opener.focus) opener.focus();
  }

  function submit(form) {
    const status = form.querySelector('.promo-status');
    const f = form.elements;
    const bad = ['name', 'phone', 'email'].find((k) => !f[k].value.trim());
    if (bad) { status.textContent = 'Please fill in your ' + (bad === 'name' ? 'full name' : bad) + '.'; status.className = 'promo-status is-err'; f[bad].focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) { status.textContent = 'Please enter a valid email address.'; status.className = 'promo-status is-err'; f.email.focus(); return; }
    const prog = PROGRAMMES.find((p) => p.id === f.programme.value).title;
    const lines = ['Programme: ' + prog, 'Name: ' + f.name.value.trim(), 'Phone: ' + f.phone.value.trim(), 'Email: ' + f.email.value.trim(), 'Organisation: ' + (f.org.value.trim() || '—')];
    const done = (msg) => { status.textContent = msg; status.className = 'promo-status is-ok'; };
    if (PROMO_ENDPOINT) {
      const data = new FormData(form); data.set('programme', prog);
      fetch(PROMO_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then((r) => { if (!r.ok) throw 0; form.reset(); markDone(); done('Thank you — your registration is in. We will contact you shortly.'); })
        .catch(() => { status.textContent = 'Could not send. Please email ' + MAILTO + ' directly.'; status.className = 'promo-status is-err'; });
      return;
    }
    const subj = 'Training registration — ' + prog, text = lines.join('\n');
    if (window.QSMail) window.QSMail.show({ to: MAILTO, subject: subj, body: text, note: 'Your registration is ready — choose how to send it.' });
    else window.location.href = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text);
    markDone();
    done('Registration ready — choose how to send it to ' + MAILTO + ' (Gmail, Outlook, your email app, or copy it).');
  }

  function open() {
    if (root.classList.contains('nav-open')) return;        // don't fight the mobile menu
    opener = document.activeElement;
    build();
    root.classList.add('promo-lock');
    // setTimeout, not requestAnimationFrame: rAF stalls while the page is mid view-transition or in a background tab
    void box.offsetWidth;                            // commit the hidden state so the entrance can animate
    setTimeout(() => {
      if (!box) return;
      box.classList.add('is-open');
      const first = box.querySelector('.promo-go');
      if (first) first.focus({ preventScroll: true });   // only focusable once visible
    }, 30);
    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-promo-close]')) return close();
      if (e.target.closest('a.promo-go')) markDone();      // external registration form opened
      const reg = e.target.closest('[data-reg]');
      if (reg) {
        const sel = box.querySelector('select[name=programme]');
        if (reg.dataset.reg) sel.value = reg.dataset.reg;
        show('form', box.querySelector('input[name=name]'));
      } else if (e.target.closest('[data-back]')) {
        show('programs', box.querySelector('.promo-go'));
      }
    });
    box.querySelector('form')?.addEventListener('submit', (e) => { e.preventDefault(); submit(e.target); });
    onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const f = [...box.querySelectorAll('a[href], button, input, select')].filter((el) => !el.closest('[hidden]'));
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
  }

  // Appear right after the page is ready — after the once-per-visit opening scene if it is playing.
  function schedule() {
    const wait = root.classList.contains('intro') ? 4300 : 700;
    setTimeout(open, wait);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();

/* ── Contact map: the embedded satellite map ignores the pointer until it is clicked,
   so scrolling the page with the wheel or a finger never gets trapped inside the map. */
(function () {
  const wrap = document.querySelector('[data-map]');
  if (!wrap) return;
  const on = () => wrap.classList.add('is-active');
  const off = () => wrap.classList.remove('is-active');
  wrap.addEventListener('click', on);
  wrap.addEventListener('mouseleave', off);
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) off(); });
})();


/* ── Mail chooser ──────────────────────────────────────────────────────
   mailto: links do nothing on a laptop with no mail app set up. On mouse/trackpad devices every
   mailto: link (and the contact / registration forms, which have no backend yet) opens a small
   chooser instead: Gmail · Outlook · email app · copy. Phones keep the native mailto: behaviour.
   Real fix when a backend exists: set FORM_ENDPOINT / PROMO_ENDPOINT above. */
(function () {
  let pick, opener, onKey, onDoc;
  const e = encodeURIComponent;

  function parse(href) {
    const raw = href.replace(/^mailto:/i, '');
    const q = raw.indexOf('?');
    const to = decodeURIComponent(q < 0 ? raw : raw.slice(0, q));
    const p = new URLSearchParams(q < 0 ? '' : raw.slice(q + 1));
    return { to: to, subject: p.get('subject') || '', body: p.get('body') || '' };
  }

  function copy(text, btn, label) {
    const done = () => { btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = label; }, 1600); };
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fallback); return; }
    fallback();
    function fallback() {
      const t = document.createElement('textarea');
      t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (err) { btn.textContent = 'Press Ctrl/⌘+C'; }
      t.remove();
    }
  }

  function close() {
    if (!pick) return;
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onDoc, true);
    pick.remove(); pick = null;
    if (opener && opener.focus) opener.focus();
  }

  function show(m) {
    close();
    opener = document.activeElement;
    const link = (m.anchor && m.anchor.getBoundingClientRect) ? m.anchor : null;
    const opt = (k, v) => (v ? '&' + k + '=' + e(v) : '');
    const gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + e(m.to) + opt('su', m.subject) + opt('body', m.body);
    const outlook = 'https://outlook.office.com/mail/deeplink/compose?to=' + e(m.to) + opt('subject', m.subject) + opt('body', m.body);
    const app = 'mailto:' + m.to + (m.subject || m.body ? '?' + (opt('subject', m.subject) + opt('body', m.body)).slice(1) : '');
    pick = document.createElement('div');
    pick.className = 'mailpick' + (link ? '' : ' is-center');
    pick.setAttribute('role', 'dialog');
    pick.setAttribute('aria-label', 'Choose how to send this email');
    pick.innerHTML =
      '<p class="mailpick-t">' + (m.note ? m.note : 'Email us at') + '</p>' +
      '<p class="mailpick-to"></p>' +
      '<div class="mailpick-row">' +
        '<a class="mailpick-b" href="' + gmail + '" target="_blank" rel="noopener">Gmail</a>' +
        '<a class="mailpick-b" href="' + outlook + '" target="_blank" rel="noopener">Outlook</a>' +
        '<a class="mailpick-b" href="' + app + '">Email app</a>' +
        '<button type="button" class="mailpick-b" data-copy="to">Copy address</button>' +
        (m.body ? '<button type="button" class="mailpick-b" data-copy="msg">Copy message</button>' : '') +
      '</div>' +
      '<button type="button" class="mailpick-x" aria-label="Close">×</button>';
    pick.querySelector('.mailpick-to').textContent = m.to;
    document.body.appendChild(pick);

    if (link) {                                   // anchor under (or above) the clicked link, kept inside the viewport
      const r = link.getBoundingClientRect(), w = pick.offsetWidth, h = pick.offsetHeight;
      let top = r.bottom + 8;
      if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 8);
      pick.style.top = top + 'px';
      pick.style.left = Math.min(Math.max(8, r.left), Math.max(8, innerWidth - w - 8)) + 'px';
    }

    pick.addEventListener('click', (ev) => {
      const b = ev.target.closest('a, button');
      if (!b) return;
      if (b.classList.contains('mailpick-x')) return close();
      if (b.dataset.copy) {
        copy(b.dataset.copy === 'to' ? m.to : ('To: ' + m.to + '\nSubject: ' + m.subject + '\n\n' + m.body), b, b.textContent);
        return;
      }
      setTimeout(close, 0);                       // a link was followed
    });
    onKey = (ev) => {
      if (ev.key === 'Escape') { close(); return; }
      if (ev.key !== 'Tab') return;
      const f = pick.querySelectorAll('a, button'), first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    };
    onDoc = (ev) => { if (pick && !pick.contains(ev.target)) close(); };
    document.addEventListener('keydown', onKey);
    setTimeout(() => document.addEventListener('click', onDoc, true), 0);
    pick.querySelector('.mailpick-b').focus({ preventScroll: true });
  }

  window.QSMail = { show: show };

  // every mailto: link on mouse/trackpad devices; phones keep the native handler
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href^="mailto:" i]');
    if (!a || a.closest('.mailpick') || ev.defaultPrevented) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button) return;
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) return;
    ev.preventDefault();
    const m = parse(a.getAttribute('href')); m.anchor = a;
    show(m);
  });
})();
