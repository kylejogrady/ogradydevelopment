/* ============================================
   O'GRADY DEVELOPMENT COMPANY
   "Stay in the know" pop-up — site-wide
   --------------------------------------------
   Loaded on every page with:
     <script src="/stay-in-the-know.js" defer></script>

   Behaviour
   - Slides in once per visit after AUTO_OPEN_SECONDS on the page
     (right-side panel on desktop, bottom sheet on phones).
   - After it is closed, a small "Stay in the know" button stays
     in the bottom-right corner of every page.
   - A visitor who closes it is not auto-shown again for
     SNOOZE_DAYS; a visitor who submits is never auto-shown again.
   - Submits to the Netlify form "stay-in-the-know" (registered by
     the hidden form in index.html), which Zapier picks up.
   - Fires GA4 "generate_lead" (and Meta "Lead" if the pixel is on)
     only after a submission succeeds.
   - Any link or button with  data-stay-in-the-know  opens it.
   ============================================ */

(function () {
  'use strict';

  /* ---------- SETTINGS ---------- */
  var AUTO_OPEN_SECONDS = 12;
  var SNOOZE_DAYS       = 7;
  var FORM_NAME         = 'stay-in-the-know';

  // Pages where the pop-up never opens by itself.
  var NO_AUTO_OPEN = ['contact', 'sell-land', 'privacy', 'terms'];
  // Pages where neither the pop-up nor the corner button appears.
  var HIDE_COMPLETELY = ['sell-land'];

  var INTERESTS = [
    'New homes coming available',
    'New vacant parcels coming available',
    'Waterfront properties',
    'Off-market opportunities'
  ];

  var COMMUNITY_BY_PAGE = {
    'victoria-farms': 'Victoria Farms',
    'peninsula-shores': 'Peninsula Shores',
    'ps13': 'Peninsula Shores',
    'ps39': 'Peninsula Shores',
    'brook-valley': 'Brook Valley',
    'westacres': 'Westacres'
  };

  /* ---------- helpers ---------- */
  var page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  if (HIDE_COMPLETELY.indexOf(page) !== -1) return;

  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function get(kind, k) { try { var s = store(kind); return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function set(kind, k, v) { try { var s = store(kind); if (s) s.setItem(k, v); } catch (e) {} }

  // Keep the first UTM values a visitor arrived with for the whole visit.
  (function rememberUtms() {
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
      if (q.get(k) && !get('sessionStorage', 'ogsk_' + k)) set('sessionStorage', 'ogsk_' + k, q.get(k));
    });
    if (!get('sessionStorage', 'ogsk_landing')) set('sessionStorage', 'ogsk_landing', location.pathname + location.search);
  })();

  var submitted = get('localStorage', 'ogsk_submitted') === '1';
  var snoozeUntil = parseInt(get('localStorage', 'ogsk_snooze_until') || '0', 10);
  var shownThisVisit = get('sessionStorage', 'ogsk_shown') === '1';

  /* ---------- styles ---------- */
  var css = '' +
  '.ogsk *,.ogsk *::before,.ogsk *::after{box-sizing:border-box;margin:0;padding:0}' +
  '.ogsk{--g:#b8a88a;--gd:#7a6a4e;--dk:#1a1a1a;--bg:#faf9f7;--wm:#f0ede8;--ln:#e6e1d8;--tx:#5c5853;font-family:Montserrat,Helvetica,Arial,sans-serif;color:var(--dk)}' +
  '.ogsk-scrim{position:fixed;inset:0;z-index:10000;background:rgba(20,18,17,.5);opacity:0;transition:opacity .45s ease}' +
  '.ogsk-panel{position:fixed;top:0;right:0;z-index:10001;width:480px;max-width:100%;height:100%;background:var(--bg);box-shadow:-24px 0 60px rgba(0,0,0,.25);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .6s cubic-bezier(.2,.75,.2,1)}' +
  '.ogsk.open .ogsk-scrim{opacity:1}.ogsk.open .ogsk-panel{transform:none}' +
  '.ogsk-top{flex:none;display:flex;align-items:center;justify-content:space-between;padding:18px 36px 0}' +
  '.ogsk-eyebrow{font-size:10.5px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gd)}' +
  '.ogsk-x{width:44px;height:44px;margin-right:-12px;border:0;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--dk)}' +
  '.ogsk-body{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 36px 24px}' +
  '.ogsk-form{display:flex;flex-direction:column;gap:22px}' +
  '.ogsk h2{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400;font-size:38px;line-height:1.1;color:var(--dk)}' +
  '.ogsk-intro{font-size:13px;line-height:1.6;color:var(--tx);margin-top:10px}' +
  '.ogsk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
  '.ogsk-field{display:flex;flex-direction:column;gap:6px}' +
  '.ogsk-lbl{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--dk)}' +
  '.ogsk-opt{font-weight:400;letter-spacing:0;text-transform:none;color:#6b665f}' +
  '.ogsk input[type=text],.ogsk input[type=email],.ogsk input[type=tel],.ogsk textarea{width:100%;border:1px solid #d9d3c8;background:#fff;font-family:inherit;font-size:16px;color:var(--dk);padding:11px 14px;border-radius:2px;outline:none;-webkit-appearance:none}' +
  '.ogsk textarea{resize:vertical;min-height:64px}' +
  '.ogsk input:focus,.ogsk textarea:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(184,168,138,.25)}' +
  '.ogsk-sub{font-size:12px;color:#6b665f;margin-top:3px}' +
  '.ogsk-list{display:flex;flex-direction:column;border:1px solid #e2ddd3;background:#fff;margin-top:10px}' +
  '.ogsk-check{display:flex;gap:12px;align-items:center;min-height:46px;padding:0 14px;border-bottom:1px solid #efebe4;cursor:pointer;font-size:13.5px;user-select:none}' +
  '.ogsk-check:last-child{border-bottom:0}' +
  '.ogsk-check input{position:absolute;opacity:0;width:1px;height:1px}' +
  '.ogsk-box{flex:none;width:18px;height:18px;border-radius:3px;border:1.5px solid #b9b2a6;background:#fff;display:flex;align-items:center;justify-content:center;transition:all .2s}' +
  '.ogsk-box svg{width:12px;height:12px;opacity:0}' +
  '.ogsk-check input:checked + .ogsk-box{background:var(--dk);border-color:var(--dk)}' +
  '.ogsk-check input:checked + .ogsk-box svg{opacity:1}' +
  '.ogsk-check input:focus-visible + .ogsk-box{outline:2px solid var(--g);outline-offset:2px}' +
  '.ogsk-check:has(input:checked){background:#f6f3ee}' +
  '.ogsk-go{width:100%;min-height:52px;border:1px solid var(--dk);background:var(--dk);color:#fff;cursor:pointer;border-radius:2px;font-family:inherit;font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;transition:all .25s}' +
  '.ogsk-go:hover{background:var(--g);border-color:var(--g);color:var(--dk)}' +
  '.ogsk-go[disabled]{opacity:.6;cursor:wait}' +
  '.ogsk-reassure{font-size:11.5px;line-height:1.55;color:var(--tx);text-align:center;margin-top:14px}' +
  '.ogsk-team{display:flex;gap:12px;align-items:center;padding-top:14px;border-top:1px solid var(--ln)}' +
  '.ogsk-faces{display:flex;flex:none}' +
  '.ogsk-faces img{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--bg)}' +
  '.ogsk-faces img+img{margin-left:-9px}' +
  '.ogsk-team span{font-size:11.5px;line-height:1.5;color:#3d3a36}' +
  '.ogsk-fine{font-size:9.5px;line-height:1.5;color:#6b665f}' +
  '.ogsk-err{display:none;padding:10px 12px;border:1px solid rgba(184,168,138,.6);background:rgba(184,168,138,.1);font-size:12px;line-height:1.6}' +
  '.ogsk-err a{color:var(--gd)}' +
  '.ogsk-hp{position:absolute;left:-9999px}' +
  '.ogsk-done{display:none;flex-direction:column;gap:22px;padding-top:28px}' +
  '.ogsk-ring{width:56px;height:56px;border-radius:50%;border:1px solid var(--g);display:flex;align-items:center;justify-content:center;color:var(--gd)}' +
  '.ogsk-teambox{display:flex;gap:12px;align-items:center;padding:14px 16px;background:var(--wm);border-radius:2px}' +
  '.ogsk-teambox .ogsk-faces img{border-color:var(--wm);width:34px;height:34px}' +
  '.ogsk-teambox span{font-size:12px;line-height:1.5;color:#3d3a36}' +
  '.ogsk a.ogsk-link{color:var(--gd);text-decoration:underline;text-underline-offset:2px}' +
  '.ogsk-cta{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gd)}' +
  '.ogsk.is-done .ogsk-form{display:none}.ogsk.is-done .ogsk-done{display:flex}' +
  '.ogsk-foot{flex:none;padding:14px 36px 16px;border-top:1px solid var(--ln);display:flex;align-items:center;justify-content:center;gap:14px;background:var(--bg)}' +
  '.ogsk-foot .lm{height:10px;width:auto}.ogsk-foot .bk{height:17px;width:auto}' +
  '.ogsk-foot i{width:1px;height:18px;background:#cfc8bc}' +
  '.ogsk-pill{position:fixed;right:24px;bottom:24px;z-index:9990;min-height:52px;padding:0 22px 0 18px;border:1px solid rgba(184,168,138,.6);border-radius:30px;background:var(--dk);color:#fff;cursor:pointer;display:none;align-items:center;gap:12px;box-shadow:0 12px 30px rgba(0,0,0,.3);font-family:inherit;text-align:left;opacity:0;transform:translateY(12px);transition:opacity .35s,transform .35s}' +
  '.ogsk-pill.show{display:flex}.ogsk-pill.in{opacity:1;transform:none}' +
  '.ogsk-pill b{width:8px;height:8px;border-radius:50%;background:var(--g);box-shadow:0 0 0 4px rgba(184,168,138,.25)}' +
  '.ogsk-pill strong{display:block;font-size:10.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}' +
  '.ogsk-pill small{display:block;font-size:10.5px;color:#cfc6b6;margin-top:2px}' +
  '@media (max-width:640px){' +
    '.ogsk-panel{top:auto;bottom:0;width:100%;height:auto;max-height:92%;border-radius:16px 16px 0 0;transform:translateY(100%);box-shadow:0 -20px 50px rgba(0,0,0,.3)}' +
    '.ogsk-panel::before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:#d9d3c8;margin:10px auto 0}' +
    '.ogsk-top{padding:6px 22px 0}.ogsk-body{padding:4px 22px 20px}.ogsk-foot{padding:12px 22px 16px}' +
    '.ogsk h2{font-size:32px}' +
    '.ogsk-pill{right:16px;bottom:16px;min-height:48px;padding:0 18px 0 16px}.ogsk-pill small{display:none}' +
  '}' +
  '@media (prefers-reduced-motion:reduce){.ogsk-panel,.ogsk-scrim,.ogsk-pill{transition:none}}';

  var check = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var faces = '<span class="ogsk-faces">' +
    '<img src="/images/sales-partners/karlie-face.jpg" alt="Karlie Acton" width="32" height="32">' +
    '<img src="/images/sales-partners/claire-face.jpg" alt="Claire Washington" width="32" height="32">' +
    '<img src="/images/sales-partners/christiaan-face.jpg" alt="Christiaan Lamprecht" width="32" height="32">' +
    '</span>';

  var interestHtml = INTERESTS.map(function (label) {
    return '<label class="ogsk-check"><input type="checkbox" value="' + label + '"><span class="ogsk-box">' + check + '</span><span>' + label + '</span></label>';
  }).join('');

  var html = '' +
  '<div class="ogsk-scrim" data-ogsk-close></div>' +
  '<div class="ogsk-panel" role="dialog" aria-modal="true" aria-labelledby="ogsk-title">' +
    '<div class="ogsk-top"><span class="ogsk-eyebrow">O’Grady Development · Property Updates</span>' +
      '<button type="button" class="ogsk-x" data-ogsk-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>' +
    '<div class="ogsk-body">' +
      '<form class="ogsk-form" name="' + FORM_NAME + '" novalidate>' +
        '<input type="hidden" name="form-name" value="' + FORM_NAME + '">' +
        '<input type="hidden" name="source" value="Website - Stay in the Know Pop-up">' +
        '<input type="hidden" name="page">' +
        '<input type="hidden" name="community">' +
        '<input type="hidden" name="interests">' +
        '<input type="hidden" name="opened_by">' +
        '<input type="hidden" name="landing_page">' +
        '<input type="hidden" name="utm_source"><input type="hidden" name="utm_medium"><input type="hidden" name="utm_campaign">' +
        '<p class="ogsk-hp"><label>Leave this empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
        '<div><h2 id="ogsk-title">Stay in the know.</h2>' +
          '<p class="ogsk-intro">Get the latest O’Grady Development inventory, homesites, pricing, community updates, and new opportunities delivered directly to you.</p></div>' +
        '<div class="ogsk-grid">' +
          '<div class="ogsk-field"><label class="ogsk-lbl" for="ogsk-first">First name</label><input id="ogsk-first" name="first_name" type="text" autocomplete="given-name" required></div>' +
          '<div class="ogsk-field"><label class="ogsk-lbl" for="ogsk-last">Last name</label><input id="ogsk-last" name="last_name" type="text" autocomplete="family-name"></div>' +
          '<div class="ogsk-field"><label class="ogsk-lbl" for="ogsk-email">Email</label><input id="ogsk-email" name="email" type="email" autocomplete="email" required></div>' +
          '<div class="ogsk-field"><label class="ogsk-lbl" for="ogsk-phone">Phone</label><input id="ogsk-phone" name="phone" type="tel" autocomplete="tel"></div>' +
        '</div>' +
        '<fieldset style="border:0"><legend class="ogsk-lbl">What would you like to hear about?</legend><div class="ogsk-sub">Select all that apply.</div>' +
          '<div class="ogsk-list">' + interestHtml + '</div></fieldset>' +
        '<div class="ogsk-field"><label class="ogsk-lbl" for="ogsk-notes">Anything else we should know? <span class="ogsk-opt">Optional</span></label><textarea id="ogsk-notes" name="message" rows="2"></textarea></div>' +
        '<div class="ogsk-err" role="alert"></div>' +
        '<div><button type="submit" class="ogsk-go">Keep me in the know</button>' +
          '<p class="ogsk-reassure">Your LiveMichigan Sales Partner is your guide to real estate throughout Northern Michigan, and your first call for the latest from O’Grady Development.</p></div>' +
        '<div class="ogsk-team">' + faces + '<span>You’ll hear directly from a member of our LiveMichigan Sales Partner team.</span></div>' +
        '<p class="ogsk-fine">By submitting, you agree to receive O’Grady Development updates and to be contacted by LiveMichigan, @properties REMI | Christie’s International Real Estate, by call, text or email. Msg &amp; data rates may apply. Reply STOP to opt out.</p>' +
      '</form>' +
      '<div class="ogsk-done" aria-live="polite">' +
        '<div class="ogsk-ring"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        '<div><h2 class="ogsk-thanks">You’re on the list.</h2>' +
          '<p class="ogsk-intro">You’ll be among the first to hear about new O’Grady homes, homesites and pricing. A member of our LiveMichigan Sales Partner team may also reach out personally.</p></div>' +
        '<div class="ogsk-teambox">' + faces + '<span>Karlie, Claire and Christiaan. <a class="ogsk-link" href="/sales-partners.html">Meet our Sales Partners</a></span></div>' +
        '<a class="ogsk-cta" href="/communities.html">Explore our communities →</a>' +
      '</div>' +
    '</div>' +
    '<div class="ogsk-foot"><img class="lm" src="/images/logos/LiveMichigan%20Logo.png" alt="LiveMichigan"><i></i><img class="bk" src="/images/logos/Properties%20Christies%20Logo.png" alt="@properties REMI | Christie’s International Real Estate"></div>' +
  '</div>';

  /* ---------- build ---------- */
  function init() {
    var style = document.createElement('style');
    style.id = 'ogsk-css';
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.className = 'ogsk';
    root.hidden = true;
    root.innerHTML = html;
    document.body.appendChild(root);

    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ogsk ogsk-pill';
    pill.setAttribute('aria-label', 'Stay in the know: new homes, homesites and pricing');
    pill.innerHTML = '<b></b><span><strong>Stay in the know</strong><small>New homes, homesites &amp; pricing</small></span>';
    document.body.appendChild(pill);

    var form = root.querySelector('form');
    var err = root.querySelector('.ogsk-err');
    var btn = root.querySelector('.ogsk-go');
    var lastFocus = null;
    var openedBy = 'auto';

    // Sit above the home page's "Sold" corner card while it is showing.
    function placePill() {
      var toast = document.querySelector('.sold-toast.show');
      if (!toast) { pill.style.bottom = ''; return; }
      var gap = window.matchMedia('(max-width: 640px)').matches ? 12 : 16;
      pill.style.bottom = Math.round(window.innerHeight - toast.getBoundingClientRect().top + gap) + 'px';
    }
    var soldToast = document.querySelector('.sold-toast');
    if (soldToast && window.MutationObserver) {
      new MutationObserver(function () { setTimeout(placePill, 650); placePill(); })
        .observe(soldToast, { attributes: true, attributeFilter: ['class'] });
      window.addEventListener('resize', placePill);
    }

    function showPill() {
      if (submitted) return;
      placePill();
      pill.classList.add('show');
      requestAnimationFrame(function () { pill.classList.add('in'); });
    }
    function hidePill() { pill.classList.remove('in', 'show'); }

    function open(by) {
      openedBy = by || 'button';
      lastFocus = document.activeElement;
      root.hidden = false;
      hidePill();
      set('sessionStorage', 'ogsk_shown', '1');
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('open'); }); });
      document.documentElement.style.overflow = 'hidden';
      setTimeout(function () {
        var f = root.classList.contains('is-done') ? root.querySelector('.ogsk-x') : root.querySelector('#ogsk-first');
        if (f && window.matchMedia('(min-width: 641px)').matches) f.focus({ preventScroll: true });
      }, 450);
      if (typeof gtag === 'function') gtag('event', 'stay_in_the_know_open', { opened_by: openedBy, page_path: location.pathname });
    }

    function close() {
      root.classList.remove('open');
      document.documentElement.style.overflow = '';
      if (!submitted) set('localStorage', 'ogsk_snooze_until', String(Date.now() + SNOOZE_DAYS * 864e5));
      setTimeout(function () { root.hidden = true; showPill(); }, 500);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    root.addEventListener('click', function (e) { if (e.target.closest('[data-ogsk-close]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
    pill.addEventListener('click', function () { open('corner-button'); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-stay-in-the-know]');
      if (t) { e.preventDefault(); open('page-button'); }
    });
    window.ogStayInTheKnow = function () { open('script'); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.style.display = 'none';
      var first = form.first_name.value.trim();
      var email = form.email.value.trim();
      if (!first || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.textContent = 'Please add your first name and a valid email address.';
        err.style.display = 'block';
        (first ? form.email : form.first_name).focus();
        return;
      }
      var picks = [].map.call(form.querySelectorAll('.ogsk-check input:checked'), function (i) { return i.value; });
      form.interests.value = picks.join(', ');
      form.page.value = document.title + ' (' + location.pathname + ')';
      form.community.value = COMMUNITY_BY_PAGE[page] || '';
      form.opened_by.value = openedBy;
      form.landing_page.value = get('sessionStorage', 'ogsk_landing') || '';
      form.utm_source.value = get('sessionStorage', 'ogsk_utm_source') || '';
      form.utm_medium.value = get('sessionStorage', 'ogsk_utm_medium') || '';
      form.utm_campaign.value = get('sessionStorage', 'ogsk_utm_campaign') || '';

      var data = new FormData(form);
      data.delete('bot-field');
      if (form['bot-field'].value) data.append('bot-field', form['bot-field'].value);
      btn.disabled = true; btn.textContent = 'Sending…';

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        submitted = true;
        set('localStorage', 'ogsk_submitted', '1');
        // Lead conversion events (sent here, after a successful send, so failed attempts aren't counted).
        if (typeof gtag === 'function') gtag('event', 'generate_lead', { form_name: FORM_NAME, page_path: location.pathname, opened_by: openedBy });
        if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: FORM_NAME });
        root.querySelector('.ogsk-thanks').textContent = 'You’re on the list, ' + first + '.';
        root.classList.add('is-done');
        root.querySelector('.ogsk-body').scrollTop = 0;
      }).catch(function () {
        err.innerHTML = 'We couldn’t send that just now. Please try again, or email <a href="mailto:Info@OGradyTeam.com">Info@OGradyTeam.com</a>.';
        err.style.display = 'block';
      }).then(function () {
        btn.disabled = false; btn.textContent = 'Keep me in the know';
      });
    });

    /* ---------- when to show ---------- */
    var canAuto = !submitted && !shownThisVisit && Date.now() > snoozeUntil && NO_AUTO_OPEN.indexOf(page) === -1;
    if (canAuto) {
      // Count only time the tab is actually visible.
      var visibleMs = 0, last = Date.now(), timer = setInterval(function () {
        var now = Date.now();
        if (document.visibilityState === 'visible') visibleMs += now - last;
        last = now;
        if (visibleMs >= AUTO_OPEN_SECONDS * 1000) {
          clearInterval(timer);
          if (!root.classList.contains('open') && !document.querySelector('.popup-overlay.open')) open('auto');
        }
      }, 500);
    } else {
      showPill();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
