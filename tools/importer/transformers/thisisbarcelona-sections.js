/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for thisisbarcelona.com.
 * beforeTransform: inserts <hr> section breaks (and temporary markers for styled
 * sections) while the original section elements still exist.
 * afterTransform: adds Section Metadata blocks for styled sections and removes
 * temporary markers.
 */

const MARKER_ATTR = 'data-excat-section-id';
const FIRST_MARKER_ATTR = 'data-excat-first-section';

function findSectionElement(root, section, used) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (let i = 0; i < selectors.length; i += 1) {
    const sel = selectors[i];
    if (!sel) continue;
    let matches = [];
    try {
      matches = Array.from(root.querySelectorAll(sel));
    } catch (e) {
      continue;
    }
    const el = matches.find((m) => !used.has(m));
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // Resolve elements in document order first so fallback selectors
    // (e.g. "div.banner") do not reuse an element claimed by an earlier section.
    const used = new Set();
    const resolved = sections.map((section) => {
      const el = findSectionElement(element, section, used);
      if (el) used.add(el);
      return { section, el };
    });

    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { section, el } = resolved[i];
      if (!el || !el.parentNode) continue;
      if (i === 0) {
        if (section.style) {
          const hr = document.createElement('hr');
          hr.setAttribute(MARKER_ATTR, section.id);
          hr.setAttribute(FIRST_MARKER_ATTR, 'true');
          el.parentNode.insertBefore(hr, el);
        }
        continue;
      }
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
      if (!marker) continue;
      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      // Place metadata at the end of the section: just before the next <hr>
      // break, or at the end of the marker's container.
      let next = marker.nextElementSibling;
      while (next && next.tagName !== 'HR') next = next.nextElementSibling;
      if (next) {
        next.parentNode.insertBefore(metadata, next);
      } else {
        marker.parentNode.appendChild(metadata);
      }
      if (marker.hasAttribute(FIRST_MARKER_ATTR)) {
        marker.remove();
      } else {
        marker.removeAttribute(MARKER_ATTR);
      }
    }
  }
}
