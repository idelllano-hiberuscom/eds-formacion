/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-interests (thisisbarcelona.com "Follow yours" tiles).
 * Source: .cmp-prescripcion .prescripcion-interes__swiper
 * Rows (one per .swiper-slide): illustration image | eyebrow <p> + label <p>
 * The section heading (.prescripcion-interes__swiper-label) is kept as
 * default content and moved in front of the block.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('.prescripcion-interes__swiper-label');

  const cells = [];
  const slides = element.querySelectorAll('.swiper-wrapper > .swiper-slide');
  slides.forEach((slide) => {
    const srcImg = slide.querySelector('.prescripcion-interes__swiper-img img');
    let imageCell = '';
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell = img;
    }

    const text = [];
    const subtitle = slide.querySelector('.prescripcion-interes__swiper-subtitle');
    const label = slide.querySelector('.prescripcion-interes__swiper-text');
    [subtitle, label].forEach((span) => {
      const value = span ? span.textContent.trim() : '';
      if (value) {
        const p = document.createElement('p');
        p.textContent = value;
        text.push(p);
      }
    });

    if (!imageCell && !text.length) return;
    cells.push([imageCell, text]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-interests', cells });
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    element.before(h2);
  }
  element.replaceWith(block);
}
