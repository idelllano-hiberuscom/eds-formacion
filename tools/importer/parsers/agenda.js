/* eslint-disable */
/* global WebImporter */

/**
 * Parser for agenda (thisisbarcelona.com cmp-agenda listing).
 * Source: .cmp-agenda
 * Key/value config rows read from section.cmp-agenda__wrapper data-* attributes
 * and h2.cmp-agenda__title. Rendered event cards are not imported (events are
 * fetched live by the block).
 */

function data(el, name) {
  const v = el ? el.getAttribute(`data-${name}`) : null;
  return v ? v.replace(/&quot;|&#34;/g, '"').replace(/&amp;/g, '&').trim() : '';
}

function formatSeasons(raw) {
  if (!raw) return '';
  try {
    const obj = JSON.parse(raw);
    return Object.keys(obj)
      .filter((k) => obj[k])
      .map((k) => `${k} ${String(obj[k]).trim()}`)
      .join(', ');
  } catch (e) {
    return raw;
  }
}

export default function parse(element, { document }) {
  const wrapper = element.matches('section.cmp-agenda__wrapper')
    ? element
    : element.querySelector('section.cmp-agenda__wrapper') || element;

  const titleEl = element.querySelector('h2.cmp-agenda__title');
  const title = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';

  const tag = data(wrapper, 'base-taxonomy-tag') || data(wrapper, 'taxonomy');
  const filterKey = data(wrapper, 'base-taxonomy-filter-key');
  let taxonomy = tag;
  if (tag && filterKey) taxonomy = `${tag} (filter key ${filterKey})`;
  else if (!tag && filterKey) taxonomy = filterKey;

  const entries = [
    ['title', title],
    ['endpoint', data(wrapper, 'elasticsearch-endpoint')],
    ['taxonomy', taxonomy],
    ['type', data(wrapper, 'type')],
    ['limit', data(wrapper, 'items-limit')],
    ['order', data(wrapper, 'order-by')],
    ['view', data(wrapper, 'view')],
    ['load-more-label', data(wrapper, 'load-more-label')],
    ['seasons', formatSeasons(data(wrapper, 'season-ranges'))],
  ];

  const cells = [];
  entries.forEach(([key, value]) => {
    if (value) cells.push([key, value]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'agenda', cells });
  element.replaceWith(block);
}
