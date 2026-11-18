/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for thisisbarcelona.com (AEM Core Components).
 * Removes non-authorable chrome, widgets, tracking and interactive controls.
 * All selectors come from migration-work/cleaned.html (plus the CookieHub
 * banner and Clarity pixel observed on the live page).
 */

// Removed before parsers run: chrome and controls that would otherwise be
// picked up as block content (buttons, arrows, markers, viewer UI).
const BEFORE_SELECTORS = [
  // Header experience fragment (includes banner alert, nav, search, mobile menu)
  'header.headerxf',
  '.headerxf',
  '#cmp-header-0',
  '#cmp-banner-alert-0',
  // Breadcrumb (not authorable)
  'nav.cmp-breadcrumb',
  // Footer experience fragment
  'footer.footerxf.experiencefragment',
  '.footerxf',
  // Cookie banner (CookieHub on live page)
  '.ch2',
  '.ch2-container',
  '#ch2-dialog',
  '[class*="cookiehub"]',
  '[id*="cookie-banner"]',
  // Save / share buttons on cards
  '.cmp-card__icon-button',
  '.cmp-agenda__card-icons',
  'button.action-button--save',
  'button.action-button--share',
  '.share-button',
  // Hidden markers
  'span.tbc-ep-marker',
  // Interactive filter UI that is not authorable (prescripcion category chips /
  // activity counters, agenda filter drawer) and screen-reader-only helper text
  '.prescripcion-interes__wrapper',
  '.prescripcion-interes__live-region',
  '.cmp-filters',
  '.cmp-link__screen-reader-only',
  // Video play/pause controls
  '.js-banner-pause',
  '.js-hero-pause',
  '.cmp-banner__pause-btn',
  '.cmp-teaser__pause-btn',
  // Swiper navigation arrows / pagination
  '.prescripcion-interes__swiper-arrows',
  '.swiper-button-prev',
  '.swiper-button-next',
  '.swiper-pagination',
  // Scene7 video viewer runtime UI (controls, share panel, dialogs)
  '.s7waiticon',
  '.s7iconeffect',
  '.s7socialshare',
  '.s7controlbar',
  '.s7emaildialog',
  '.s7embeddialog',
  '.s7linkdialog',
  // Tracking pixels / ad iframes
  'img[src*="clarity.ms"]',
  'iframe[src*="flashtalking.com"]',
  'iframe[src*="clarity.ms"]',
];

// Final cleanup after parsers have produced blocks.
// Note: generic header/footer/nav are NOT removed — the agenda block uses
// <header class="cmp-agenda__header"> for its authorable title.
const AFTER_SELECTORS = [
  'header.headerxf',
  'footer.footerxf',
  'nav.tib-header__nav',
  'nav.cmp-breadcrumb',
  'script',
  'style',
  'link',
  'noscript',
  'template',
  'iframe',
  'span[id^="s7classic_"]',
];

const TRACKING_ATTRS = [
  'data-cmp-data-layer',
  'data-cmp-data-layer-enabled',
  'data-cmp-data-layer-name',
  'data-cmp-link-accessibility-enabled',
  'data-cmp-link-accessibility-text',
  'data-is-edit-mode',
  'onclick',
];

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    let nodes = [];
    try {
      nodes = root.querySelectorAll(sel);
    } catch (e) {
      return;
    }
    nodes.forEach((n) => n.remove());
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Inline <link>/<script>/<noscript> appear throughout the component markup
    removeAll(element, ['script', 'link', 'noscript', 'style']);
    removeAll(element, BEFORE_SELECTORS);
  }

  if (hookName === 'afterTransform') {
    removeAll(element, AFTER_SELECTORS);
    element.querySelectorAll('*').forEach((el) => {
      TRACKING_ATTRS.forEach((attr) => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
    });
  }
}
