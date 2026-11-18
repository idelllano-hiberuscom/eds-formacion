/**
 * cards-highlighted: intro panel plus a carousel of flip cards.
 *
 * Authored rows:
 *   1. Intro: (empty cell) | H2, lead paragraph, CTA link
 *   2..n. Flip card: media (video link and/or image) | optional back-face text
 * A card with back-face text flips on click/Enter/Space; a card without it is media only.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const VIDEO_RE = /\/is\/content\/|\.(mp4|webm|ogv|ogg)(\?|$)/i;
const POSTER_RE = /\/is\/image\//i;

let instance = 0;

function optimizePicture(pic) {
  const img = pic.querySelector('img');
  if (!img) return pic;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return pic;
  return createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
}

function buildVideo(src, poster) {
  const video = document.createElement('video');
  video.className = 'cards-highlighted-video';
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  ['muted', 'loop', 'playsinline'].forEach((a) => video.setAttribute(a, ''));
  video.preload = 'none';
  if (poster) video.poster = poster;
  video.dataset.src = src;
  return video;
}

function buildMedia(cell) {
  const media = document.createElement('div');
  media.className = 'cards-highlighted-media';
  if (!cell) return media;
  const links = [...cell.querySelectorAll('a[href]')];
  const videoLink = links.find((a) => VIDEO_RE.test(a.href));
  const pic = cell.querySelector('picture');
  if (videoLink) {
    const posterLink = links.find((a) => a !== videoLink && POSTER_RE.test(a.href));
    const poster = pic?.querySelector('img')?.src || posterLink?.href || '';
    media.append(buildVideo(videoLink.href, poster));
    media.classList.add('is-video');
  } else if (pic) {
    media.append(optimizePicture(pic));
  }
  return media;
}

function buildCard(row) {
  const cells = [...row.children];
  const mediaCell = cells.find((c) => c.querySelector('picture, a[href]')
    && [...c.querySelectorAll('a[href]')].every((a) => VIDEO_RE.test(a.href) || POSTER_RE.test(a.href)));
  const textCell = cells.find((c) => c !== mediaCell && c.textContent.trim());

  const li = document.createElement('li');
  li.className = 'cards-highlighted-card';

  const inner = document.createElement('div');
  inner.className = 'cards-highlighted-inner';

  const front = document.createElement('div');
  front.className = 'cards-highlighted-front';
  front.append(buildMedia(mediaCell));
  inner.append(front);

  if (textCell) {
    const back = document.createElement('div');
    back.className = 'cards-highlighted-back';
    back.append(...textCell.childNodes);
    inner.append(back);
    li.classList.add('is-flippable');
    inner.setAttribute('role', 'button');
    inner.tabIndex = 0;
    inner.setAttribute('aria-pressed', 'false');
    inner.setAttribute('aria-label', 'Flip card');
    back.setAttribute('aria-hidden', 'true');
    const flip = (e) => {
      if (e.target.closest('a')) return; // let links on the back face work
      const flipped = li.classList.toggle('is-flipped');
      inner.setAttribute('aria-pressed', String(flipped));
      back.setAttribute('aria-hidden', String(!flipped));
    };
    inner.addEventListener('click', flip);
    inner.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip(e);
      }
    });
  }

  li.append(inner);
  return li;
}

function updateArrows(block) {
  const track = block.querySelector('.cards-highlighted-cards');
  const prev = block.querySelector('.cards-highlighted-prev');
  const next = block.querySelector('.cards-highlighted-next');
  if (!track || !prev || !next) return;
  prev.disabled = track.scrollLeft <= 1;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
}

function scrollByCard(block, dir) {
  const track = block.querySelector('.cards-highlighted-cards');
  const card = track.querySelector('.cards-highlighted-card');
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  track.scrollBy({ left: dir * step, behavior: 'smooth' });
}

function observeVideos(block) {
  const videos = block.querySelectorAll('video.cards-highlighted-video');
  if (!videos.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        if (!target.src && target.dataset.src) target.src = target.dataset.src;
        if (!reduced) target.play().catch(() => {});
      } else if (!target.paused) {
        target.pause();
      }
    });
  }, { threshold: 0.4 });
  videos.forEach((v) => observer.observe(v));
}

export default function decorate(block) {
  instance += 1;
  const rows = [...block.children];
  const [introRow, ...cardRows] = rows;

  const intro = document.createElement('div');
  intro.className = 'cards-highlighted-intro';
  if (introRow) {
    [...introRow.children]
      .filter((cell) => cell.textContent.trim() || cell.querySelector('picture'))
      .forEach((cell) => intro.append(...cell.childNodes));
  }

  const carousel = document.createElement('div');
  carousel.className = 'cards-highlighted-carousel';
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-roledescription', 'carousel');
  const heading = intro.querySelector('h1, h2, h3');
  if (heading) {
    heading.id = heading.id || `cards-highlighted-${instance}-title`;
    carousel.setAttribute('aria-labelledby', heading.id);
  }

  const track = document.createElement('ul');
  track.className = 'cards-highlighted-cards';
  track.id = `cards-highlighted-${instance}-cards`;
  cardRows.forEach((row) => track.append(buildCard(row)));
  carousel.append(track);

  if (cardRows.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'cards-highlighted-nav';
    nav.innerHTML = `
      <button type="button" class="cards-highlighted-prev" aria-controls="${track.id}" aria-label="Previous card"></button>
      <button type="button" class="cards-highlighted-next" aria-controls="${track.id}" aria-label="Next card"></button>`;
    carousel.append(nav);
    nav.querySelector('.cards-highlighted-prev').addEventListener('click', () => scrollByCard(block, -1));
    nav.querySelector('.cards-highlighted-next').addEventListener('click', () => scrollByCard(block, 1));
  }

  block.textContent = '';
  if (intro.children.length) block.append(intro);
  block.append(carousel);

  if (cardRows.length > 1) {
    let raf;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updateArrows(block));
    }, { passive: true });
    new ResizeObserver(() => updateArrows(block)).observe(track);
  }
  observeVideos(block);
}
