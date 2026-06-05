/* ============================================
   O'GRADY DEVELOPMENT COMPANY
   Conversion tracking + retargeting pixels
   --------------------------------------------
   GA4 lead tracking is LIVE as soon as this file
   is deployed (it uses your existing GA4 tag).

   Meta Pixel and Google Ads stay dormant until
   you paste your IDs into the three lines in
   STEP 1 below — no other edits needed anywhere.
   ============================================ */

(function () {
  'use strict';

  /* ---- STEP 1: PASTE YOUR IDs HERE (blank = stays off) ---- */
  var META_PIXEL_ID       = '';   // e.g. '1234567890123456'  — from Meta Events Manager
  var GOOGLE_ADS_ID       = '';   // e.g. 'AW-123456789'       — from Google Ads
  var GOOGLE_ADS_LEAD_LBL = '';   // e.g. 'AbC-D_efGhIjK'      — Ads conversion "label"

  /* ---- Meta Pixel base code (loads only when an ID is present) ---- */
  if (META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  /* ---- Google Ads tag (piggybacks on your existing gtag) ---- */
  if (GOOGLE_ADS_ID && typeof gtag === 'function') {
    gtag('config', GOOGLE_ADS_ID);
  }

  /* ---- Fire a lead conversion whenever a form is submitted ---- */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    if (!/post/i.test(form.getAttribute('method') || '')) return;

    // Skip likely bots: Netlify honeypot field was filled in
    var honeypot = form.querySelector('[name="bot-field"]');
    if (honeypot && honeypot.value) return;

    var formName = form.getAttribute('name') || form.id || 'unknown_form';

    // GA4 — recommended "generate_lead" event (LIVE now)
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        form_name: formName,
        page_path: window.location.pathname
      });
    }

    // Meta Pixel — standard "Lead" event
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: formName });
    }

    // Google Ads — conversion (fires once both ID + label are set)
    if (GOOGLE_ADS_ID && GOOGLE_ADS_LEAD_LBL && typeof gtag === 'function') {
      gtag('event', 'conversion', {
        send_to: GOOGLE_ADS_ID + '/' + GOOGLE_ADS_LEAD_LBL
      });
    }
  }, true); // capture phase: fires even though each page calls preventDefault

})();
