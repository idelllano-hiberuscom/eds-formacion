/**
 * hero-video: full-bleed hero with a desktop and a mobile background video.
 *
 * Authored rows:
 *   1. Desktop media: video link (Scene7 /is/content/ or .mp4/.webm) + optional poster image
 *   2. Mobile media: video link + optional poster image (optional row)
 *   3. Text: paragraphs (no heading)
 * Media rows are detected by their video link, so the order is forgiving.
 */

const DESKTOP_MQ = '(width >= 900px)';
const VIDEO_RE = /\/is\/content\/|\.(mp4|webm|ogv|ogg|m3u8)(\?|$)/i;
const POSTER_RE = /\/is\/image\//i;

function getMedia(row) {
  const links = [...row.querySelectorAll('a[href]')];
  const videoLink = links.find((a) => VIDEO_RE.test(a.href));
  if (!videoLink) return null;
  const img = row.querySelector('picture img, img');
  const posterLink = links.find((a) => a !== videoLink && POSTER_RE.test(a.href));
  return {
    src: videoLink.href,
    poster: img?.src || posterLink?.href || '',
  };
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function decorate(block) {
  const rows = [...block.children];
  const mediaRows = [];
  const contentRows = [];
  rows.forEach((row) => {
    const media = getMedia(row);
    if (media) mediaRows.push(media);
    else contentRows.push(row);
  });

  const [desktop, mobile] = mediaRows;

  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'hero-video-media';

  if (desktop) {
    const video = document.createElement('video');
    video.className = 'hero-video-video';
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('loop', '');
    video.setAttribute('aria-hidden', 'true');
    video.preload = 'auto';
    const reduced = prefersReducedMotion();
    if (!reduced) {
      video.autoplay = true;
      video.setAttribute('autoplay', '');
    }

    const mq = window.matchMedia(DESKTOP_MQ);
    const apply = () => {
      const source = (!mq.matches && mobile) ? mobile : desktop;
      if (video.dataset.current === source.src) return;
      video.dataset.current = source.src;
      if (source.poster) video.poster = source.poster;
      else video.removeAttribute('poster');
      video.src = source.src;
      if (!reduced) {
        video.play().catch(() => { /* autoplay blocked: poster stays visible */ });
      }
    };
    apply();
    mq.addEventListener('change', apply);
    mediaWrap.append(video);
  } else {
    // no video authored: keep any picture as a static background
    const pic = block.querySelector('picture');
    if (pic) mediaWrap.append(pic);
  }

  const content = document.createElement('div');
  content.className = 'hero-video-content';
  contentRows.forEach((row) => {
    [...row.children].forEach((cell) => {
      // drop media leftovers (a picture without a video link is handled above)
      cell.querySelectorAll('picture').forEach((pic) => {
        if (!mediaWrap.contains(pic)) pic.closest('p')?.remove();
      });
      content.append(...cell.childNodes);
    });
  });
  content.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, a')) p.remove();
  });

  block.textContent = '';
  block.append(mediaWrap);
  if (content.children.length) block.append(content);
}
