/**
 * hero-banner: banner with a background video (or image), optional H2 (may be a link),
 * description and CTA, plus a play/pause toggle for the video.
 *
 * Authored rows:
 *   1. Background media: video link (Scene7 /is/content/ or .mp4/.webm) + poster image,
 *      or just an image
 *   2. Content: optional H2 (optionally linked), optional paragraph(s), CTA link
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const VIDEO_RE = /\/is\/content\/|\.(mp4|webm|ogv|ogg)(\?|$)/i;
const POSTER_RE = /\/is\/image\//i;

function optimize(pic) {
  const img = pic.querySelector('img');
  if (!img) return pic;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return pic;
  return createOptimizedPicture(img.src, img.alt, true, [{ media: '(width >= 900px)', width: '2000' }, { width: '900' }]);
}

function buildVideo(src, poster) {
  const video = document.createElement('video');
  video.className = 'hero-banner-video';
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  ['muted', 'loop', 'playsinline'].forEach((a) => video.setAttribute(a, ''));
  video.setAttribute('aria-hidden', 'true');
  video.preload = 'metadata';
  if (poster) video.poster = poster;
  video.src = src;
  return video;
}

function buildToggle(video) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hero-banner-toggle';
  const update = () => {
    const { paused } = video;
    button.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    button.setAttribute('aria-pressed', String(!paused));
    button.classList.toggle('is-paused', paused);
  };
  button.addEventListener('click', () => {
    if (video.paused) {
      video.dataset.userPaused = '';
      video.play().catch(() => {});
    } else {
      video.dataset.userPaused = 'true';
      video.pause();
    }
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  update();
  return button;
}

export default function decorate(block) {
  const rows = [...block.children];
  let mediaRow = rows.find((row) => [...row.querySelectorAll('a[href]')].some((a) => VIDEO_RE.test(a.href)));
  if (!mediaRow) {
    mediaRow = rows.find((row) => row.querySelector('picture') && !row.querySelector('h1, h2, h3'));
  }
  const contentRows = rows.filter((row) => row !== mediaRow);

  const media = document.createElement('div');
  media.className = 'hero-banner-media';
  let video;

  if (mediaRow) {
    const links = [...mediaRow.querySelectorAll('a[href]')];
    const videoLink = links.find((a) => VIDEO_RE.test(a.href));
    const pic = mediaRow.querySelector('picture');
    const posterLink = links.find((a) => a !== videoLink && POSTER_RE.test(a.href));
    if (videoLink) {
      const poster = pic?.querySelector('img')?.src || posterLink?.href || '';
      video = buildVideo(videoLink.href, poster);
      media.append(video);
    } else if (pic) {
      media.append(optimize(pic));
    }
  }

  const content = document.createElement('div');
  content.className = 'hero-banner-content';
  contentRows.forEach((row) => {
    [...row.children].forEach((cell) => content.append(...cell.childNodes));
  });
  content.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture')) p.remove();
  });
  const heading = content.querySelector('h1, h2, h3');
  if (heading) heading.classList.add('hero-banner-title');
  content.querySelectorAll('.button-container').forEach((p) => p.classList.add('hero-banner-actions'));

  block.textContent = '';
  if (media.children.length) block.append(media);
  block.append(content);

  if (video) {
    block.classList.add('has-video');
    block.append(buildToggle(video));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // play only while on screen, and never against the user's pause choice
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!reduced && video.dataset.userPaused !== 'true') video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(block);
  }
}
