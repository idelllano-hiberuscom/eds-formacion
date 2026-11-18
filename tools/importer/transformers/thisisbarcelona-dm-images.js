/* eslint-disable */
/* global WebImporter */

/**
 * Dynamic Media / Scene7 transformer for thisisbarcelona.com.
 * afterTransform only: rewrites Scene7 /is/image/ (and DM Open API) <img>
 * elements into anchors that survive markdown/docx round-trips. The
 * scripts/scripts.js auto-block rebuilds <picture> elements at render time.
 *
 * - Unlinked image: <a href="DM-URL">alt</a>
 * - Linked image (image is the sole content of a link): keep href, set
 *   title="DM-URL", replace link content with alt text.
 * - Mixed-content anchors are skipped with a warning.
 */

const EMPTY_ALT_SENTINEL = 'Image without alt text';

function isDynamicMediaUrl(urlStr) {
  if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
  let u;
  try {
    u = new URL(urlStr, 'https://x/');
  } catch (e) {
    return false;
  }
  if (u.pathname.startsWith('/is/image/')) return true;
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
    && u.pathname.startsWith('/adobe/assets/urn:')) return true;
  return false;
}

function normalizeUrl(src) {
  return src.startsWith('//') ? `https:${src}` : src;
}

function hasOtherMeaningfulContent(anchor, img) {
  const clone = anchor.cloneNode(true);
  // Remove the image (and an enclosing <picture>) from the clone
  clone.querySelectorAll('img, picture, source').forEach((n) => n.remove());
  if (clone.textContent.trim()) return true;
  if (clone.querySelector('img, video, svg, iframe')) return true;
  return false;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const document = element.ownerDocument;

  Array.from(element.querySelectorAll('img')).forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!isDynamicMediaUrl(src)) return;
    const dmUrl = normalizeUrl(src);
    const alt = (img.getAttribute('alt') || '').trim() || EMPTY_ALT_SENTINEL;

    const anchor = img.closest('a');
    if (anchor && element.contains(anchor)) {
      if (hasOtherMeaningfulContent(anchor, img)) {
        console.warn(`[dm-images] Skipping DM image inside mixed-content link: ${dmUrl}`);
        return;
      }
      anchor.setAttribute('title', dmUrl);
      anchor.textContent = alt;
      return;
    }

    const a = document.createElement('a');
    a.setAttribute('href', dmUrl);
    a.textContent = alt;
    const picture = img.parentElement && img.parentElement.tagName === 'PICTURE'
      ? img.parentElement
      : null;
    (picture || img).replaceWith(a);
  });
}
