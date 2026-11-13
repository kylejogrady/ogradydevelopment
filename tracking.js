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

  /* ---- Campaign attribution (QR codes, email links, ads) ----
     When someone lands with utm_ tags in the link (e.g. a lot-sign QR code),
     remember them for 60 days. If that person later submits ANY form on the
     site, the tag is appended to the form's "source" field, so it shows up in
     the Netlify submission, Google Sheet, Zapier and Lofty. Example:
       "Website - Westacres Page | QR: Westacres Lot Sign (Unit 4)"        */
  var ATTRIB_KEY = 'og_attrib', ATTRIB_DAYS = 60;

  function readAttrib() {
    try {
      var a = JSON.parse(localStorage.getItem(ATTRIB_KEY) || 'null');
      if (a && a.t && (Date.now() - a.t) < ATTRIB_DAYS * 864e5) return a;
    } catch (err) {}
    return null;
  }

  (function captureAttrib() {
    try {
      var q = new URLSearchParams(window.location.search);
      var src = q.get('utm_source');
      if (!src) return;
      localStorage.setItem(ATTRIB_KEY, JSON.stringify({
        source:   src,
        medium:   q.get('utm_medium')   || '',
        campaign: q.get('utm_campaign') || '',
        content:  q.get('utm_content')  || '',
        landing:  window.location.pathname,
        t:        Date.now()
      }));
    } catch (err) {}
  })();

  function attribLabel(a) {
    function nice(v) { return String(v).replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
    var unit = /^unit[-_ ]?(\d+)$/i.exec(a.content || '');
    if (a.source === 'lot-sign' && a.medium === 'qr') {
      return 'QR: ' + nice(a.campaign || 'community') + ' Lot Sign' + (unit ? ' (Unit ' + unit[1] + ')' : '');
    }
    return 'Via ' + [a.source, a.medium, a.campaign, a.content].filter(Boolean).join(' / ');
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

    // Tag the lead with the campaign that brought them (see attribution above)
    var attrib = readAttrib();
    if (attrib) {
      var label = attribLabel(attrib);
      var srcField = form.querySelector('[name="source"]');
      if (srcField && srcField.value.indexOf(label) === -1) {
        srcField.value = (srcField.value ? srcField.value + ' | ' : '') + label;
      }
    }

    // GA4 — recommended "generate_lead" event (LIVE now)
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        form_name: formName,
        page_path: window.location.pathname,
        lead_attribution: attrib ? attribLabel(attrib) : '(none)'
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

  /* ---- Shared failure message so a lost submission never looks like a win ---- */
  window.ogFormError = function (form) {
    if (!form) return;
    var m = form.querySelector('.og-form-error');
    if (!m) { m = document.createElement('div'); m.className = 'og-form-error'; form.appendChild(m); }
    m.setAttribute('style', 'margin-top:16px;padding:12px 14px;border:1px solid rgba(184,168,138,0.55);background:rgba(184,168,138,0.10);font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:12px;font-weight:300;line-height:1.7;color:#1a1a1a;');
    m.innerHTML = 'We couldn\'t send that just now. Please email <a href="mailto:Info@OGradyTeam.com" style="color:#b8a88a;">Info@OGradyTeam.com</a> or try again in a moment.';
  };

})();
