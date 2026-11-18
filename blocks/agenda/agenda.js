/**
 * agenda: live event listing fetched from the This is Barcelona POI search endpoint.
 *
 * Key/value config rows (all optional except endpoint):
 *   title            heading shown above the listing
 *   endpoint         search endpoint; relative paths resolve against `origin`
 *   origin           source host (default https://thisisbarcelona.com)
 *   taxonomy         tag filter, e.g. "tipus-contingut:content-agenda" or the full tag path
 *   type             listing type of the source component (recorded, not sent)
 *   limit            page size (default 4)
 *   order            orderBy value (default startDateAsc)
 *   view             initial view: list | grid (default list)
 *   load-more-label  label of the button that loads the next page
 *   seasons          "spring 20/03-21/06, summer 21/06-23/09, ..." (dd/mm ranges)
 *
 * Request: GET {endpoint}?tagsfilter&dateFrom[&dateTo&excludeUndatedAgenda]
 *          &poiTypeSelector=agendaType&language&maxResults&offset&orderBy
 * Response: { items: [{ id, title, titleUrl, description, imageUrl, imageAlt,
 *            infoTags[], address, startDate, endDate }], total }
 */
import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_ORIGIN = 'https://thisisbarcelona.com';
const REQUEST_TIMEOUT = 10000;

function text(value) {
  if (Array.isArray(value)) return value.join(' ').trim();
  return (value || '').toString().trim();
}

/** "a:b/c/d (filter key x:y)" -> "x:y"; "ns:root/group/tag" -> "group:tag" */
export function parseTaxonomy(raw) {
  const value = text(raw);
  if (!value) return '';
  const explicit = value.match(/filter key\s+([^\s)]+)/i);
  if (explicit) return explicit[1];
  const path = value.split(/\s+/)[0];
  const tagPath = path.includes(':') ? path.split(':').pop() : path;
  const parts = tagPath.split('/').filter(Boolean);
  if (parts.length >= 2 && !path.match(/^[^/]+:[^/]+$/)) {
    return `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
  }
  return path;
}

/** "spring 20/03-21/06, winter 21/12-20/03" -> [{ name, from: [d, m], to: [d, m] }] */
export function parseSeasons(raw) {
  const value = Array.isArray(raw) ? raw.join(',') : text(raw);
  return value.split(/[,;\n]/).map((part) => {
    const m = part.trim().match(/^([\p{L}\s-]+?)\s*:?\s*(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})$/u);
    if (!m) return null;
    return {
      name: m[1].trim(),
      from: [Number(m[2]), Number(m[3])],
      to: [Number(m[4]), Number(m[5])],
    };
  }).filter(Boolean);
}

/** Current or next occurrence of a season, clipped so it never starts before today. */
export function seasonRange(season, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const year = now.getUTCFullYear();
  const wraps = season.to[1] < season.from[1]
    || (season.to[1] === season.from[1] && season.to[0] < season.from[0]);
  for (let y = year - 1; y <= year + 1; y += 1) {
    const start = Date.UTC(y, season.from[1] - 1, season.from[0]);
    const end = Date.UTC(wraps ? y + 1 : y, season.to[1] - 1, season.to[0], 23, 59);
    if (end >= today) return { from: new Date(Math.max(start, today)), to: new Date(end) };
  }
  return null;
}

function isoDay(date, endOfDay = false) {
  const d = date.toISOString().slice(0, 10);
  return `${d}T${endOfDay ? '23:59:00' : '00:00:00'}Z`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined && content !== null) node.textContent = content;
  return node;
}

function absolute(url, origin) {
  if (!url) return '';
  try {
    return new URL(url, origin).href;
  } catch (e) {
    return '';
  }
}

/* month abbreviations used by the source site (data-i18n-month-abbr*) */
const MONTH_ABBR = {
  en: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'],
};

function formatDateParts(iso, lang) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const opts = { timeZone: 'UTC' };
  return {
    day: new Intl.DateTimeFormat(lang, { ...opts, day: '2-digit' }).format(date),
    month: MONTH_ABBR[lang]?.[date.getUTCMonth()]
      || new Intl.DateTimeFormat(lang, { ...opts, month: 'short' }).format(date),
    monthLong: new Intl.DateTimeFormat(lang, { ...opts, month: 'long' }).format(date),
    year: new Intl.DateTimeFormat(lang, { ...opts, year: 'numeric' }).format(date),
    full: new Intl.DateTimeFormat(lang, {
      ...opts, day: 'numeric', month: 'long', year: 'numeric',
    }).format(date),
    iso: date.toISOString(),
  };
}

/** "20 of November of 2026" / "From 21 of November to 01 of December of 2026" (grid view) */
function dateText(start, end, lang) {
  if (lang !== 'en') return end ? `${start.full} – ${end.full}` : start.full;
  const long = (p, withYear) => `${p.day} of ${p.monthLong}${withYear ? ` of ${p.year}` : ''}`;
  if (!end) return long(start, true);
  const sameYear = start.year === end.year;
  return `From ${long(start, !sameYear)} to ${long(end, true)}`;
}

function buildDate(start, end) {
  const wrap = el('div', 'agenda-event-date');
  const part = (p) => {
    const t = document.createElement('time');
    t.className = 'agenda-date-group';
    t.dateTime = p.iso;
    t.setAttribute('aria-label', p.full);
    const meta = el('span', 'agenda-date-meta');
    meta.append(el('span', 'agenda-date-month', p.month), el('span', 'agenda-date-year', p.year));
    t.append(el('span', 'agenda-date-day', p.day), meta);
    return t;
  };
  wrap.append(part(start));
  if (end) {
    wrap.append(el('span', 'agenda-date-separator', '-'), part(end));
    wrap.classList.add('is-range');
  }
  return wrap;
}

/*
 * One flat article per event; CSS places the parts for the three layouts:
 * mobile list (date column + text), desktop list (text | hover image | big date)
 * and grid cards (text above image, category tag on the image).
 */
function buildEvent(item, config) {
  const li = el('li', 'agenda-event');
  const article = el('article', 'agenda-event-inner');
  const href = absolute(item.titleUrl || item.ctaSaberUrl, config.origin);

  const start = item.startDate && formatDateParts(item.startDate, config.lang);
  let end = item.endDate && formatDateParts(item.endDate, config.lang);
  if (start && end && end.full === start.full) end = null;
  if (start) article.append(buildDate(start, end));

  const category = item.infoTags?.length ? item.infoTags.join(' | ') : '';
  const metaParts = [];
  if (start) metaParts.push(el('span', 'agenda-event-when', dateText(start, end, config.lang)));
  if (category) metaParts.push(el('span', 'agenda-event-category', category));
  if (item.address) metaParts.push(el('span', 'agenda-event-location', item.address));
  if (metaParts.length) {
    const meta = el('p', 'agenda-event-meta');
    metaParts.forEach((p, i) => {
      if (i) meta.append(el('span', 'agenda-event-divider', '|'));
      meta.append(p);
    });
    article.append(meta);
  }

  const title = el('h3', 'agenda-event-title');
  if (href) {
    const a = el('a', null, item.title || '');
    a.href = href;
    title.append(a);
  } else {
    title.textContent = item.title || '';
  }
  article.append(title);

  if (item.description) article.append(el('p', 'agenda-event-summary', item.description));

  if (href) {
    const actions = el('div', 'agenda-event-actions');
    const more = el('a', 'agenda-event-link', 'Find out more');
    more.href = href;
    more.setAttribute('aria-hidden', 'true');
    more.tabIndex = -1;
    actions.append(more);
    article.append(actions);
  }

  if (item.imageUrl) {
    const media = el('div', 'agenda-event-image');
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.imageAlt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => media.remove());
    media.append(img);
    if (category) media.append(el('span', 'agenda-event-tag', category));
    article.append(media);
  }

  li.append(article);
  return li;
}

function readConfig(block) {
  const raw = readBlockConfig(block);
  const origin = text(raw.origin) || DEFAULT_ORIGIN;
  const limit = parseInt(text(raw.limit), 10);
  const view = text(raw.view).toLowerCase() === 'grid' ? 'grid' : 'list';
  return {
    title: text(raw.title),
    origin,
    endpoint: absolute(text(raw.endpoint) || '/bin/thisisbcn/pois/search', origin),
    tagsfilter: parseTaxonomy(raw.taxonomy),
    type: text(raw.type),
    limit: Number.isFinite(limit) && limit > 0 ? limit : 4,
    order: text(raw.order) || 'startDateAsc',
    view,
    loadMoreLabel: text(raw['load-more-label']) || 'See all',
    seasons: parseSeasons(raw.seasons),
    lang: (document.documentElement.lang || 'en').slice(0, 2).toLowerCase(),
  };
}

async function fetchEvents(config, { offset, range }) {
  const url = new URL(config.endpoint);
  const today = new Date();
  if (config.tagsfilter) url.searchParams.set('tagsfilter', config.tagsfilter);
  url.searchParams.set('dateFrom', isoDay(range ? range.from : today));
  if (range) {
    url.searchParams.set('dateTo', isoDay(range.to, true));
    url.searchParams.set('excludeUndatedAgenda', 'true');
  }
  url.searchParams.set('poiTypeSelector', 'agendaType');
  url.searchParams.set('language', config.lang);
  url.searchParams.set('maxResults', String(config.limit));
  if (offset) url.searchParams.set('offset', String(offset));
  url.searchParams.set('orderBy', config.order);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const resp = await fetch(url, { signal: controller.signal, credentials: 'omit' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    return {
      items: Array.isArray(json.items) ? json.items : [],
      total: Number(json.total) || 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

/* phosphor squares-four / list (the source icon font is not loaded) */
const VIEW_ICONS = {
  grid: '<svg class="agenda-view-icon" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16" d="M48 48h56v56H48zM152 48h56v56h-56zM48 152h56v56H48zM152 152h56v56h-56z"/></svg>',
  list: '<svg class="agenda-view-icon" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16" d="M40 128h176M40 64h176M40 192h176"/></svg>',
};

function buildToggle(block, initial) {
  const toggle = el('div', 'agenda-view-toggle');
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'View');
  const buttons = ['grid', 'list'].map((view) => {
    const b = el('button', `agenda-view-btn agenda-view-btn-${view}`);
    b.type = 'button';
    b.dataset.view = view;
    b.innerHTML = VIEW_ICONS[view];
    b.append(el('span', null, capitalize(view)));
    return b;
  });
  const set = (view) => {
    block.classList.toggle('agenda-view-grid', view === 'grid');
    block.classList.toggle('agenda-view-list', view === 'list');
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  };
  buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.view)));
  toggle.append(...buttons);
  set(initial);
  return toggle;
}

/*
 * The date numerals are sized for the narrow SwisspostersVAR face. When no web
 * font is declared for it (commercial font, not shipped) a wider fallback is
 * used, so flag the block and let CSS scale the numerals down to fit.
 */
async function flagFallbackFont(block) {
  try {
    const faces = await document.fonts.load('700 56px SwisspostersVAR-Black', '0123456789');
    if (!faces.length) block.classList.add('agenda-font-fallback');
  } catch (e) {
    block.classList.add('agenda-font-fallback');
  }
}

export default function decorate(block) {
  const config = readConfig(block);
  flagFallbackFont(block);
  block.textContent = '';
  block.setAttribute('aria-busy', 'true');

  const header = el('div', 'agenda-header');
  if (config.title) header.append(el('h2', 'agenda-title', config.title));
  header.append(buildToggle(block, config.view));
  block.append(header);

  const state = { offset: 0, range: null, loaded: 0 };

  let chips;
  if (config.seasons.length) {
    chips = el('div', 'agenda-filters');
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', 'Filter by season');
    config.seasons.forEach((season) => {
      const chip = el('button', 'agenda-chip', capitalize(season.name));
      chip.type = 'button';
      chip.dataset.season = season.name.toLowerCase();
      chip.setAttribute('aria-pressed', 'false');
      chips.append(chip);
    });
    block.append(chips);
  }

  const list = el('ul', 'agenda-events');
  const status = el('p', 'agenda-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const more = el('button', 'agenda-load-more button secondary', config.loadMoreLabel);
  more.type = 'button';
  more.hidden = true;
  const count = el('span', 'agenda-results-count');
  const footer = el('div', 'agenda-footer');
  footer.append(count, more);
  block.append(list, status, footer);

  let requestId = 0;
  const load = async (append) => {
    requestId += 1;
    const current = requestId;
    if (!append) {
      state.offset = 0;
      state.loaded = 0;
    }
    block.setAttribute('aria-busy', 'true');
    more.disabled = true;
    status.textContent = append ? '' : 'Loading events…';
    try {
      const { items, total } = await fetchEvents(config, state);
      if (current !== requestId) return;
      if (!append) list.textContent = '';
      items.forEach((item) => list.append(buildEvent(item, config)));
      state.loaded += items.length;
      state.offset = state.loaded;
      status.textContent = state.loaded ? '' : 'No events found.';
      more.hidden = !items.length || state.loaded >= total;
      count.textContent = state.loaded ? `${state.loaded} / ${Math.max(total, state.loaded)}` : '';
    } catch (e) {
      if (current !== requestId) return;
      // CORS, network, timeout or bad response: degrade to a short message
      if (!append) list.textContent = '';
      more.hidden = true;
      count.textContent = '';
      status.textContent = 'Events could not be loaded right now.';
      block.classList.add('agenda-error');
    } finally {
      if (current === requestId) {
        more.disabled = false;
        block.removeAttribute('aria-busy');
      }
    }
  };

  more.addEventListener('click', () => load(true));

  chips?.addEventListener('click', (e) => {
    const chip = e.target.closest('.agenda-chip');
    if (!chip) return;
    const active = chip.getAttribute('aria-pressed') === 'true';
    chips.querySelectorAll('.agenda-chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    if (active) {
      state.range = null;
    } else {
      chip.setAttribute('aria-pressed', 'true');
      const season = config.seasons.find((s) => s.name.toLowerCase() === chip.dataset.season);
      state.range = season ? seasonRange(season) : null;
    }
    block.classList.remove('agenda-error');
    load(false);
  });

  // not awaited: a slow or blocked request must not hold up later sections
  load(false);
}
