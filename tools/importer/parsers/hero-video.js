/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-video (thisisbarcelona.com home hero).
 * Source: .cmp-hero-component.cmp-teaser--hero-home
 * Rows:
 *   1. Desktop video link (Scene7 /is/content/) + poster <img>
 *   2. Mobile video link + poster <img>
 *   3. Text paragraphs (no heading)
 */

function attr(el, name) {
  const v = el && el.getAttribute(name);
  return v ? v.replace(/&amp;/g, '&').trim() : '';
}

function videoCell(document, container) {
  if (!container) return null;
  const video = container.querySelector('video');
  if (!video) return null;
  const source = video.querySelector('source[src]');
  let src = attr(video, 'data-tib-src') || attr(video, 'src') || attr(source, 'src');
  if (src.startsWith('blob:')) src = attr(video, 'data-tib-src');
  const poster = attr(video, 'poster') || attr(video, 'data-tib-poster');
  if (!src && !poster) return null;
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
  return cell;
}

export default function parse(element, { document }) {
  const cells = [];

  const desktop = videoCell(document, element.querySelector('.cmp-teaser__media--desktop'));
  const mobile = videoCell(document, element.querySelector('.cmp-teaser__media--mobile'));
  cells.push([desktop || '']);
  cells.push([mobile || '']);

  const text = [];
  const desc = element.querySelector('.cmp-teaser__description');
  if (desc) {
    const paras = [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) {
      paras.forEach((p) => {
        const np = document.createElement('p');
        np.innerHTML = p.innerHTML.replace(/&nbsp;| /g, ' ').trim();
        text.push(np);
      });
    } else if (desc.textContent.trim()) {
      const np = document.createElement('p');
      np.textContent = desc.textContent.trim();
      text.push(np);
    }
  }
  cells.push([text]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
