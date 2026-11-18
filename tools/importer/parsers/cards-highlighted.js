/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-highlighted (thisisbarcelona.com highlighted flip cards).
 * Source: .cmp-card-highlighted
 * Rows:
 *   1. (intro) empty | H2 + description + CTA link
 *   2..n one per .cmp-card-flip: front media (video link + poster, or image) | back text (optional)
 * DM video divs (.js-video-dm) carry the asset in data-config JSON
 * (contenturl + asset = video, serverurl + posterimage = poster).
 */

function attr(el, name) {
  const v = el && el.getAttribute(name);
  return v ? v.replace(/&amp;/g, '&').trim() : '';
}

function join(base, path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${(base || '').replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function videoParts(document, src, poster, alt) {
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
    img.alt = alt || '';
    cell.push(img);
  }
  return cell;
}

function frontMedia(document, front) {
  if (!front) return '';

  // Dynamic Media (Scene7 viewer) video
  const dm = front.querySelector('.js-video-dm');
  if (dm) {
    let cfg = null;
    const raw = dm.getAttribute('data-config');
    if (raw) {
      try {
        cfg = JSON.parse(raw.replace(/&quot;|&#34;/g, '"'));
      } catch (e) {
        cfg = null;
      }
    }
    if (cfg && cfg.asset) {
      const src = join(cfg.contenturl || cfg.videoserverurl || 'https://s7g10.scene7.com/is/content/', cfg.asset);
      const poster = cfg.posterimage
        ? join(cfg.serverurl || 'https://s7g10.scene7.com/is/image/', cfg.posterimage)
        : '';
      const cell = videoParts(document, src, poster, dm.getAttribute('aria-label') || '');
      if (cell.length) return cell;
    }
  }

  // Native video
  const video = front.querySelector('video');
  if (video) {
    const source = video.querySelector('source[src]');
    let src = attr(video, 'data-tib-src') || attr(video, 'src') || attr(source, 'src');
    if (src.startsWith('blob:')) src = attr(video, 'data-tib-src');
    const poster = attr(video, 'poster') || attr(video, 'data-tib-poster');
    const cell = videoParts(document, src, poster, '');
    if (cell.length) return cell;
  }

  // Image (skip Scene7 viewer UI sprites)
  const srcImg = front.querySelector('.cmp-media__image img[src], img.cmp-media__img[src]');
  if (srcImg) {
    const img = document.createElement('img');
    img.src = attr(srcImg, 'src');
    img.alt = srcImg.getAttribute('alt') || '';
    return img;
  }
  return '';
}

function backText(document, card) {
  const out = [];
  const title = card.querySelector('.cmp-card-flip__face--front .cmp-card-flip__title');
  if (title && title.textContent.trim()) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    p.append(strong);
    out.push(p);
  }
  const back = card.querySelector('.cmp-card-flip__face--back');
  if (back) {
    const nodes = [...back.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, a[href]')]
      .filter((n) => !n.parentElement.closest('h1, h2, h3, h4, h5, h6, p, li'));
    nodes.forEach((n) => {
      const value = n.textContent.replace(/\s+/g, ' ').trim();
      if (!value) return;
      if (/^H[1-6]$/.test(n.tagName)) {
        const h = document.createElement('h3');
        h.textContent = value;
        out.push(h);
      } else if (n.tagName === 'A') {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = n.getAttribute('href');
        a.textContent = value;
        p.append(a);
        out.push(p);
      } else {
        const p = document.createElement('p');
        p.innerHTML = n.innerHTML.trim();
        out.push(p);
      }
    });
    if (!nodes.length && back.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = back.textContent.replace(/\s+/g, ' ').trim();
      out.push(p);
    }
  }
  return out.length ? out : '';
}

export default function parse(element, { document }) {
  const cells = [];

  // Intro row
  const intro = [];
  const panel = element.querySelector('.carousel-panel') || element;
  const heading = panel.querySelector('.cmp-card-highlighted__title h1, .cmp-card-highlighted__title h2, .cmp-card-highlighted__title h3');
  if (heading && heading.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    intro.push(h2);
  }
  const desc = panel.querySelector('.cmp-card-highlighted__description');
  if (desc && desc.textContent.trim()) {
    const paras = [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) {
      paras.forEach((p) => {
        const np = document.createElement('p');
        np.innerHTML = p.innerHTML.trim();
        intro.push(np);
      });
    } else {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      intro.push(p);
    }
  }
  panel.querySelectorAll('.cmp-card-highlighted__cta a').forEach((srcA) => {
    const href = attr(srcA, 'href') || attr(srcA, 'data-href');
    if (!href) return;
    const labelSpan = [...srcA.querySelectorAll('span')]
      .find((s) => !s.classList.contains('cmp-link__screen-reader-only') && s.textContent.trim());
    const label = (labelSpan ? labelSpan.textContent : srcA.textContent).replace(/\s+/g, ' ').trim();
    if (!label) return;
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    p.append(a);
    intro.push(p);
  });
  cells.push(['', intro]);

  // One row per flip card
  element.querySelectorAll('.cmp-card-flip').forEach((card) => {
    const media = frontMedia(document, card.querySelector('.cmp-card-flip__face--front'));
    const text = backText(document, card);
    if (!media && !text) return;
    cells.push([media, text]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-highlighted', cells });
  element.replaceWith(block);
}
