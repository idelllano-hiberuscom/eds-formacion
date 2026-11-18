/**
 * carousel-interests: horizontally scrolling row of interest tiles with prev/next arrows.
 *
 * Authored rows (one per slide):
 *   cell 1: illustration image
 *   cell 2: eyebrow paragraph + label paragraph (an optional link makes the tile clickable)
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

let instance = 0;

function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]));
  });
}

function buildSlide(row, index, id) {
  const li = document.createElement('li');
  li.className = 'carousel-interests-slide';
  li.id = `carousel-interests-${id}-slide-${index}`;
  li.setAttribute('role', 'group');
  li.setAttribute('aria-roledescription', 'slide');

  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture') && !c.textContent.trim());
  const textCell = cells.find((c) => c !== imageCell);

  if (imageCell) {
    imageCell.className = 'carousel-interests-image';
    li.append(imageCell);
  }
  if (textCell) {
    textCell.className = 'carousel-interests-content';
    // a single-paragraph cell may hold both lines separated by <br>
    let paras = [...textCell.querySelectorAll(':scope > p')];
    if (!paras.length && textCell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...textCell.childNodes);
      textCell.append(p);
      paras = [p];
    }
    if (paras.length >= 2) {
      paras[0].classList.add('carousel-interests-eyebrow');
      paras[paras.length - 1].classList.add('carousel-interests-label');
    } else if (paras.length === 1) {
      paras[0].classList.add('carousel-interests-label');
    }
    li.append(textCell);
    const label = (paras.length ? paras.map((p) => p.textContent) : [textCell.textContent])
      .join(' ').replace(/\s+/g, ' ').trim();
    if (label) li.setAttribute('aria-label', label);
  }

  // whole-tile link: if the content carries one link, stretch it over the tile
  const links = li.querySelectorAll('a[href]');
  if (links.length === 1) {
    li.classList.add('has-link');
    links[0].classList.remove('button');
    links[0].closest('.button-container')?.classList.remove('button-container');
  }
  return li;
}

function updateArrows(block) {
  const track = block.querySelector('.carousel-interests-slides');
  const prev = block.querySelector('.carousel-interests-prev');
  const next = block.querySelector('.carousel-interests-next');
  if (!track || !prev || !next) return;
  const max = track.scrollWidth - track.clientWidth - 1;
  prev.disabled = track.scrollLeft <= 1;
  next.disabled = track.scrollLeft >= max;
}

function scrollByPage(block, dir) {
  const track = block.querySelector('.carousel-interests-slides');
  const slide = track.querySelector('.carousel-interests-slide');
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const step = slide ? slide.getBoundingClientRect().width + gap : track.clientWidth;
  track.scrollBy({ left: dir * step, behavior: 'smooth' });
}

export default function decorate(block) {
  instance += 1;
  const id = instance;
  const rows = [...block.children];

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');

  const track = document.createElement('ul');
  track.className = 'carousel-interests-slides';
  track.id = `carousel-interests-${id}-slides`;
  rows.forEach((row, idx) => {
    track.append(buildSlide(row, idx, id));
    row.remove();
  });
  optimizeImages(track);

  block.textContent = '';

  if (rows.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'carousel-interests-nav';
    nav.innerHTML = `
      <button type="button" class="carousel-interests-prev" aria-controls="${track.id}" aria-label="Previous slide"></button>
      <button type="button" class="carousel-interests-next" aria-controls="${track.id}" aria-label="Next slide"></button>`;
    block.append(nav);
    nav.querySelector('.carousel-interests-prev').addEventListener('click', () => scrollByPage(block, -1));
    nav.querySelector('.carousel-interests-next').addEventListener('click', () => scrollByPage(block, 1));
  }
  block.append(track);

  if (rows.length > 1) {
    let raf;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updateArrows(block));
    }, { passive: true });
    new ResizeObserver(() => updateArrows(block)).observe(track);
    updateArrows(block);
  }
}
