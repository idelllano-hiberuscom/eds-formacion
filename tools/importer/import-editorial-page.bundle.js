/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-editorial-page.js
  var import_editorial_page_exports = {};
  __export(import_editorial_page_exports, {
    default: () => import_editorial_page_default
  });

  // tools/importer/parsers/hero-video.js
  function attr(el, name) {
    const v = el && el.getAttribute(name);
    return v ? v.replace(/&amp;/g, "&").trim() : "";
  }
  function videoCell(document, container) {
    if (!container) return null;
    const video = container.querySelector("video");
    if (!video) return null;
    const source = video.querySelector("source[src]");
    let src = attr(video, "data-tib-src") || attr(video, "src") || attr(source, "src");
    if (src.startsWith("blob:")) src = attr(video, "data-tib-src");
    const poster = attr(video, "poster") || attr(video, "data-tib-poster");
    if (!src && !poster) return null;
    const cell = [];
    if (src) {
      const a = document.createElement("a");
      a.href = src;
      a.textContent = src;
      cell.push(a);
    }
    if (poster) {
      const img = document.createElement("img");
      img.src = poster;
      img.alt = "";
      cell.push(img);
    }
    return cell;
  }
  function parse(element, { document }) {
    const cells = [];
    const desktop = videoCell(document, element.querySelector(".cmp-teaser__media--desktop"));
    const mobile = videoCell(document, element.querySelector(".cmp-teaser__media--mobile"));
    cells.push([desktop || ""]);
    cells.push([mobile || ""]);
    const text = [];
    const desc = element.querySelector(".cmp-teaser__description");
    if (desc) {
      const paras = [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim());
      if (paras.length) {
        paras.forEach((p) => {
          const np = document.createElement("p");
          np.innerHTML = p.innerHTML.replace(/&nbsp;| /g, " ").trim();
          text.push(np);
        });
      } else if (desc.textContent.trim()) {
        const np = document.createElement("p");
        np.textContent = desc.textContent.trim();
        text.push(np);
      }
    }
    cells.push([text]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-interests.js
  function parse2(element, { document }) {
    const heading = element.querySelector(".prescripcion-interes__swiper-label");
    const cells = [];
    const slides = element.querySelectorAll(".swiper-wrapper > .swiper-slide");
    slides.forEach((slide) => {
      const srcImg = slide.querySelector(".prescripcion-interes__swiper-img img");
      let imageCell = "";
      if (srcImg && srcImg.getAttribute("src")) {
        const img = document.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell = img;
      }
      const text = [];
      const subtitle = slide.querySelector(".prescripcion-interes__swiper-subtitle");
      const label = slide.querySelector(".prescripcion-interes__swiper-text");
      [subtitle, label].forEach((span) => {
        const value = span ? span.textContent.trim() : "";
        if (value) {
          const p = document.createElement("p");
          p.textContent = value;
          text.push(p);
        }
      });
      if (!imageCell && !text.length) return;
      cells.push([imageCell, text]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-interests", cells });
    if (heading) {
      const h2 = document.createElement("h2");
      h2.textContent = heading.textContent.trim();
      element.before(h2);
    }
    element.replaceWith(block);
  }

  // tools/importer/parsers/agenda.js
  function data(el, name) {
    const v = el ? el.getAttribute(`data-${name}`) : null;
    return v ? v.replace(/&quot;|&#34;/g, '"').replace(/&amp;/g, "&").trim() : "";
  }
  function formatSeasons(raw) {
    if (!raw) return "";
    try {
      const obj = JSON.parse(raw);
      return Object.keys(obj).filter((k) => obj[k]).map((k) => `${k} ${String(obj[k]).trim()}`).join(", ");
    } catch (e) {
      return raw;
    }
  }
  function parse3(element, { document }) {
    const wrapper = element.matches("section.cmp-agenda__wrapper") ? element : element.querySelector("section.cmp-agenda__wrapper") || element;
    const titleEl = element.querySelector("h2.cmp-agenda__title");
    const title = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
    const tag = data(wrapper, "base-taxonomy-tag") || data(wrapper, "taxonomy");
    const filterKey = data(wrapper, "base-taxonomy-filter-key");
    let taxonomy = tag;
    if (tag && filterKey) taxonomy = `${tag} (filter key ${filterKey})`;
    else if (!tag && filterKey) taxonomy = filterKey;
    const entries = [
      ["title", title],
      ["endpoint", data(wrapper, "elasticsearch-endpoint")],
      ["taxonomy", taxonomy],
      ["type", data(wrapper, "type")],
      ["limit", data(wrapper, "items-limit")],
      ["order", data(wrapper, "order-by")],
      ["view", data(wrapper, "view")],
      ["load-more-label", data(wrapper, "load-more-label")],
      ["seasons", formatSeasons(data(wrapper, "season-ranges"))]
    ];
    const cells = [];
    entries.forEach(([key, value]) => {
      if (value) cells.push([key, value]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "agenda", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  function attr2(el, name) {
    const v = el && el.getAttribute(name);
    return v ? v.replace(/&amp;/g, "&").trim() : "";
  }
  function normalizeHref(href) {
    if (!href) return "";
    const m = href.match(/^\/content\/thisisbarcelona\/[a-z]{2}(\/.*?)?(\.html)?([?#].*)?$/);
    if (m) return `${m[1] || "/"}${m[3] || ""}`;
    return href;
  }
  function mediaCell(document, element) {
    const media = element.querySelector(".cmp-banner__media-inner--desktop") || element.querySelector(".cmp-banner__media");
    if (!media) return "";
    const video = media.querySelector("video");
    if (video) {
      const source = video.querySelector("source[src]");
      let src = attr2(video, "data-tib-src") || attr2(video, "src") || attr2(source, "src");
      if (src.startsWith("blob:")) src = attr2(video, "data-tib-src");
      const poster = attr2(video, "poster") || attr2(video, "data-tib-poster");
      const cell = [];
      if (src) {
        const a = document.createElement("a");
        a.href = src;
        a.textContent = src;
        cell.push(a);
      }
      if (poster) {
        const img = document.createElement("img");
        img.src = poster;
        img.alt = "";
        cell.push(img);
      }
      if (cell.length) return cell;
    }
    const srcImg = media.querySelector("img[src]");
    if (srcImg) {
      const img = document.createElement("img");
      img.src = attr2(srcImg, "src");
      img.alt = srcImg.getAttribute("alt") || "";
      return img;
    }
    return "";
  }
  function parse4(element, { document }) {
    const cells = [];
    cells.push([mediaCell(document, element)]);
    const content = [];
    const group = element.querySelector(".cmp-banner__heading-group");
    const srcHeading = group ? group.querySelector("h1, h2, h3, h4") : element.querySelector(".cmp-banner__container h1, .cmp-banner__container h2");
    if (srcHeading && srcHeading.textContent.trim()) {
      const h2 = document.createElement("h2");
      const href = normalizeHref(attr2(group, "href"));
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = srcHeading.textContent.trim();
        h2.append(a);
      } else {
        h2.textContent = srcHeading.textContent.trim();
      }
      content.push(h2);
    }
    const desc = element.querySelector(".cmp-banner__description");
    if (desc && desc.textContent.trim()) {
      const paras = [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim());
      if (paras.length) {
        paras.forEach((p) => {
          const np = document.createElement("p");
          np.innerHTML = p.innerHTML.trim();
          content.push(np);
        });
      } else {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        content.push(p);
      }
    }
    element.querySelectorAll(".cmp-banner__actions a").forEach((srcA) => {
      const href = normalizeHref(attr2(srcA, "href") || attr2(srcA, "data-href"));
      const label = srcA.textContent.replace(/\s+/g, " ").trim();
      if (!href || !label) return;
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      p.append(a);
      content.push(p);
    });
    cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-highlighted.js
  function attr3(el, name) {
    const v = el && el.getAttribute(name);
    return v ? v.replace(/&amp;/g, "&").trim() : "";
  }
  function join(base, path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${(base || "").replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  }
  function videoParts(document, src, poster, alt) {
    const cell = [];
    if (src) {
      const a = document.createElement("a");
      a.href = src;
      a.textContent = src;
      cell.push(a);
    }
    if (poster) {
      const img = document.createElement("img");
      img.src = poster;
      img.alt = alt || "";
      cell.push(img);
    }
    return cell;
  }
  function frontMedia(document, front) {
    if (!front) return "";
    const dm = front.querySelector(".js-video-dm");
    if (dm) {
      let cfg = null;
      const raw = dm.getAttribute("data-config");
      if (raw) {
        try {
          cfg = JSON.parse(raw.replace(/&quot;|&#34;/g, '"'));
        } catch (e) {
          cfg = null;
        }
      }
      if (cfg && cfg.asset) {
        const src = join(cfg.contenturl || cfg.videoserverurl || "https://s7g10.scene7.com/is/content/", cfg.asset);
        const poster = cfg.posterimage ? join(cfg.serverurl || "https://s7g10.scene7.com/is/image/", cfg.posterimage) : "";
        const cell = videoParts(document, src, poster, dm.getAttribute("aria-label") || "");
        if (cell.length) return cell;
      }
    }
    const video = front.querySelector("video");
    if (video) {
      const source = video.querySelector("source[src]");
      let src = attr3(video, "data-tib-src") || attr3(video, "src") || attr3(source, "src");
      if (src.startsWith("blob:")) src = attr3(video, "data-tib-src");
      const poster = attr3(video, "poster") || attr3(video, "data-tib-poster");
      const cell = videoParts(document, src, poster, "");
      if (cell.length) return cell;
    }
    const srcImg = front.querySelector(".cmp-media__image img[src], img.cmp-media__img[src]");
    if (srcImg) {
      const img = document.createElement("img");
      img.src = attr3(srcImg, "src");
      img.alt = srcImg.getAttribute("alt") || "";
      return img;
    }
    return "";
  }
  function backText(document, card) {
    const out = [];
    const title = card.querySelector(".cmp-card-flip__face--front .cmp-card-flip__title");
    if (title && title.textContent.trim()) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = title.textContent.replace(/\s+/g, " ").trim();
      p.append(strong);
      out.push(p);
    }
    const back = card.querySelector(".cmp-card-flip__face--back");
    if (back) {
      const nodes = [...back.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, a[href]")].filter((n) => !n.parentElement.closest("h1, h2, h3, h4, h5, h6, p, li"));
      nodes.forEach((n) => {
        const value = n.textContent.replace(/\s+/g, " ").trim();
        if (!value) return;
        if (/^H[1-6]$/.test(n.tagName)) {
          const h = document.createElement("h3");
          h.textContent = value;
          out.push(h);
        } else if (n.tagName === "A") {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = n.getAttribute("href");
          a.textContent = value;
          p.append(a);
          out.push(p);
        } else {
          const p = document.createElement("p");
          p.innerHTML = n.innerHTML.trim();
          out.push(p);
        }
      });
      if (!nodes.length && back.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = back.textContent.replace(/\s+/g, " ").trim();
        out.push(p);
      }
    }
    return out.length ? out : "";
  }
  function parse5(element, { document }) {
    const cells = [];
    const intro = [];
    const panel = element.querySelector(".carousel-panel") || element;
    const heading = panel.querySelector(".cmp-card-highlighted__title h1, .cmp-card-highlighted__title h2, .cmp-card-highlighted__title h3");
    if (heading && heading.textContent.trim()) {
      const h2 = document.createElement("h2");
      h2.textContent = heading.textContent.trim();
      intro.push(h2);
    }
    const desc = panel.querySelector(".cmp-card-highlighted__description");
    if (desc && desc.textContent.trim()) {
      const paras = [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim());
      if (paras.length) {
        paras.forEach((p) => {
          const np = document.createElement("p");
          np.innerHTML = p.innerHTML.trim();
          intro.push(np);
        });
      } else {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        intro.push(p);
      }
    }
    panel.querySelectorAll(".cmp-card-highlighted__cta a").forEach((srcA) => {
      const href = attr3(srcA, "href") || attr3(srcA, "data-href");
      if (!href) return;
      const labelSpan = [...srcA.querySelectorAll("span")].find((s) => !s.classList.contains("cmp-link__screen-reader-only") && s.textContent.trim());
      const label = (labelSpan ? labelSpan.textContent : srcA.textContent).replace(/\s+/g, " ").trim();
      if (!label) return;
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      p.append(a);
      intro.push(p);
    });
    cells.push(["", intro]);
    element.querySelectorAll(".cmp-card-flip").forEach((card) => {
      const media = frontMedia(document, card.querySelector(".cmp-card-flip__face--front"));
      const text = backText(document, card);
      if (!media && !text) return;
      cells.push([media, text]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-highlighted", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/thisisbarcelona-cleanup.js
  var BEFORE_SELECTORS = [
    // Header experience fragment (includes banner alert, nav, search, mobile menu)
    "header.headerxf",
    ".headerxf",
    "#cmp-header-0",
    "#cmp-banner-alert-0",
    // Breadcrumb (not authorable)
    "nav.cmp-breadcrumb",
    // Footer experience fragment
    "footer.footerxf.experiencefragment",
    ".footerxf",
    // Cookie banner (CookieHub on live page)
    ".ch2",
    ".ch2-container",
    "#ch2-dialog",
    '[class*="cookiehub"]',
    '[id*="cookie-banner"]',
    // Save / share buttons on cards
    ".cmp-card__icon-button",
    ".cmp-agenda__card-icons",
    "button.action-button--save",
    "button.action-button--share",
    ".share-button",
    // Hidden markers
    "span.tbc-ep-marker",
    // Interactive filter UI that is not authorable (prescripcion category chips /
    // activity counters, agenda filter drawer) and screen-reader-only helper text
    ".prescripcion-interes__wrapper",
    ".prescripcion-interes__live-region",
    ".cmp-filters",
    ".cmp-link__screen-reader-only",
    // Video play/pause controls
    ".js-banner-pause",
    ".js-hero-pause",
    ".cmp-banner__pause-btn",
    ".cmp-teaser__pause-btn",
    // Swiper navigation arrows / pagination
    ".prescripcion-interes__swiper-arrows",
    ".swiper-button-prev",
    ".swiper-button-next",
    ".swiper-pagination",
    // Scene7 video viewer runtime UI (controls, share panel, dialogs)
    ".s7waiticon",
    ".s7iconeffect",
    ".s7socialshare",
    ".s7controlbar",
    ".s7emaildialog",
    ".s7embeddialog",
    ".s7linkdialog",
    // Tracking pixels / ad iframes
    'img[src*="clarity.ms"]',
    'iframe[src*="flashtalking.com"]',
    'iframe[src*="clarity.ms"]'
  ];
  var AFTER_SELECTORS = [
    "header.headerxf",
    "footer.footerxf",
    "nav.tib-header__nav",
    "nav.cmp-breadcrumb",
    "script",
    "style",
    "link",
    "noscript",
    "template",
    "iframe",
    'span[id^="s7classic_"]'
  ];
  var TRACKING_ATTRS = [
    "data-cmp-data-layer",
    "data-cmp-data-layer-enabled",
    "data-cmp-data-layer-name",
    "data-cmp-link-accessibility-enabled",
    "data-cmp-link-accessibility-text",
    "data-is-edit-mode",
    "onclick"
  ];
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      let nodes = [];
      try {
        nodes = root.querySelectorAll(sel);
      } catch (e) {
        return;
      }
      nodes.forEach((n) => n.remove());
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeAll(element, ["script", "link", "noscript", "style"]);
      removeAll(element, BEFORE_SELECTORS);
    }
    if (hookName === "afterTransform") {
      removeAll(element, AFTER_SELECTORS);
      element.querySelectorAll("*").forEach((el) => {
        TRACKING_ATTRS.forEach((attr4) => {
          if (el.hasAttribute(attr4)) el.removeAttribute(attr4);
        });
      });
    }
  }

  // tools/importer/transformers/thisisbarcelona-sections.js
  var MARKER_ATTR = "data-excat-section-id";
  var FIRST_MARKER_ATTR = "data-excat-first-section";
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
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const used = /* @__PURE__ */ new Set();
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
            const hr2 = document.createElement("hr");
            hr2.setAttribute(MARKER_ATTR, section.id);
            hr2.setAttribute(FIRST_MARKER_ATTR, "true");
            el.parentNode.insertBefore(hr2, el);
          }
          continue;
        }
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
        if (!marker) continue;
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        let next = marker.nextElementSibling;
        while (next && next.tagName !== "HR") next = next.nextElementSibling;
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

  // tools/importer/transformers/thisisbarcelona-dm-images.js
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function isDynamicMediaUrl(urlStr) {
    if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) return true;
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) return true;
    return false;
  }
  function normalizeUrl(src) {
    return src.startsWith("//") ? `https:${src}` : src;
  }
  function hasOtherMeaningfulContent(anchor, img) {
    const clone = anchor.cloneNode(true);
    clone.querySelectorAll("img, picture, source").forEach((n) => n.remove());
    if (clone.textContent.trim()) return true;
    if (clone.querySelector("img, video, svg, iframe")) return true;
    return false;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const document = element.ownerDocument;
    Array.from(element.querySelectorAll("img")).forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!isDynamicMediaUrl(src)) return;
      const dmUrl = normalizeUrl(src);
      const alt = (img.getAttribute("alt") || "").trim() || EMPTY_ALT_SENTINEL;
      const anchor = img.closest("a");
      if (anchor && element.contains(anchor)) {
        if (hasOtherMeaningfulContent(anchor, img)) {
          console.warn(`[dm-images] Skipping DM image inside mixed-content link: ${dmUrl}`);
          return;
        }
        anchor.setAttribute("title", dmUrl);
        anchor.textContent = alt;
        return;
      }
      const a = document.createElement("a");
      a.setAttribute("href", dmUrl);
      a.textContent = alt;
      const picture = img.parentElement && img.parentElement.tagName === "PICTURE" ? img.parentElement : null;
      (picture || img).replaceWith(a);
    });
  }

  // tools/importer/import-editorial-page.js
  var PAGE_TEMPLATE = {
    "name": "editorial-page",
    "urls": [
      "https://thisisbarcelona.com/",
      "https://thisisbarcelona.com/architecture",
      "https://thisisbarcelona.com/architecture/houses-and-emblematic-buildings/casa-roviralta"
    ],
    "representativeUrl": "https://thisisbarcelona.com/",
    "description": "Editorial pages built from stacked hero/banner/carousel/cards components (home, category, POI detail)",
    "blocks": [
      {
        "name": "hero-video",
        "instances": [
          ".cmp-hero-component.cmp-teaser--hero-home"
        ]
      },
      {
        "name": "carousel-interests",
        "instances": [
          ".cmp-prescripcion .prescripcion-interes__swiper"
        ]
      },
      {
        "name": "agenda",
        "instances": [
          ".cmp-agenda"
        ]
      },
      {
        "name": "hero-banner",
        "instances": [
          "div.banner"
        ]
      },
      {
        "name": "cards-highlighted",
        "instances": [
          ".cmp-card-highlighted"
        ]
      }
    ],
    "urlPattern": "/*",
    "sections": [
      {
        "id": "section-1",
        "name": "Home video hero",
        "selector": [
          ".cmp-hero-component.cmp-teaser--hero-home",
          "#cmp-hero-component-0"
        ],
        "style": null,
        "blocks": [
          "hero-video"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Interest profiles",
        "selector": [
          "section.cmp-prescripcion",
          "#cmp-prescripcion-0"
        ],
        "style": "light-beige",
        "blocks": [
          "carousel-interests"
        ],
        "defaultContent": [
          ".prescripcion-interes__swiper-label"
        ]
      },
      {
        "id": "section-3",
        "name": "Agenda",
        "selector": [
          "section.cmp-agenda",
          "#cmp-agenda-0"
        ],
        "style": null,
        "blocks": [
          "agenda"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "Art scene video banner",
        "selector": [
          "div.banner:has(#cmp-banner-0)",
          "div.banner"
        ],
        "style": null,
        "blocks": [
          "hero-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "section-5",
        "name": "Highlighted cards",
        "selector": [
          "div.cmp-card-highlighted",
          "#cmp-card-highlighted-0"
        ],
        "style": null,
        "blocks": [
          "cards-highlighted"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Barcelona Card banner",
        "selector": [
          "div.banner:has(#cmp-banner-1)",
          "div.banner"
        ],
        "style": null,
        "blocks": [
          "hero-banner"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "hero-video": parse,
    "carousel-interests": parse2,
    "agenda": parse3,
    "hero-banner": parse4,
    "cards-highlighted": parse5
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var transformers = [transform, ...lateTransformers, transform3];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      matches.forEach((element) => {
        if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    };
    template.blocks.forEach((blockDef) => {
      const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
      (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
    });
    template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
    return pageBlocks;
  }
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_editorial_page_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_editorial_page_exports);
})();
