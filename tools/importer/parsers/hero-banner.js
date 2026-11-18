/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner (thisisbarcelona.com mid-page banners).
 * Source: div.banner
 * Rows:
 *   1. Background media: video link (Scene7 /is/content/) + poster <img>, or image
 *   2. Optional H2 (linked when a.cmp-banner__heading-group has an href),
 *      optional description, CTA link(s) from .cmp-banner__actions
 */

function attr(el, name) {
  const v = el && el.getAttribute(name);
  return v ? v.replace(/&amp;/g, '&').trim() : '';
}

/** AEM repository paths (data-href) -> public paths. */
function normalizeHref(href) {
  if (!href) return '';
  const m = href.match(/^\/content\/thisisbarcelona\/[a-z]{2}(\/.*?)?(\.html)?([?#].*)?$/);
  if (m) return `${m[1] || '/'}${m[3] || ''}`;
  return href;
}

function mediaCell(document, element) {
  const media = element.querySelector('.cmp-banner__media-inner--desktop')
    || element.querySelector('.cmp-banner__media');
  if (!media) return '';
  const video = media.querySelector('video');
  if (video) {
    const source = video.querySelector('source[src]');
    let src = attr(video, 'data-tib-src') || attr(video, 'src') || attr(source, 'src');
    if (src.startsWith('blob:')) src = attr(video, 'data-tib-src');
    const poster = attr(video, 'poster') || attr(video, 'data-tib-poster');
    const cell = [];
    if (src) {
      const a = document.createElement('a');
      a.href = src;
      a.textContent = src;
      cell.push(a);
    }
    if (poster) {
      const img = document.createElement('img');
      img.src = poster;
      img.alt = '';
      cell.push(img);
    }
    if (cell.length) return cell;
  }
  const srcImg = media.querySelector('img[src]');
  if (srcImg) {
    const img = document.createElement('img');
    img.src = attr(srcImg, 'src');
    img.alt = srcImg.getAttribute('alt') || '';
    return img;
  }
  return '';
}

export default function parse(element, { document }) {
  const cells = [];
  cells.push([mediaCell(document, element)]);

  const content = [];
  const group = element.querySelector('.cmp-banner__heading-group');
  const srcHeading = group
    ? group.querySelector('h1, h2, h3, h4')
    : element.querySelector('.cmp-banner__container h1, .cmp-banner__container h2');
  if (srcHeading && srcHeading.textContent.trim()) {
    const h2 = document.createElement('h2');
    const href = normalizeHref(attr(group, 'href'));
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = srcHeading.textContent.trim();
      h2.append(a);
    } else {
      h2.textContent = srcHeading.textContent.trim();
    }
    content.push(h2);
  }

  const desc = element.querySelector('.cmp-banner__description');
  if (desc && desc.textContent.trim()) {
    const paras = [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) {
      paras.forEach((p) => {
        const np = document.createElement('p');
        np.innerHTML = p.innerHTML.trim();
        content.push(np);
      });
    } else {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      content.push(p);
    }
  }

  element.querySelectorAll('.cmp-banner__actions a').forEach((srcA) => {
    const href = normalizeHref(attr(srcA, 'href') || attr(srcA, 'data-href'));
    const label = srcA.textContent.replace(/\s+/g, ' ').trim();
    if (!href || !label) return;
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    p.append(a);
    content.push(p);
  });

  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
