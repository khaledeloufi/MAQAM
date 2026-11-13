/* =============================================================
   MAQAM | مَقام — Shared UI: navigation, cart drawer, toasts,
   quick-add modal, contact form, motion system.
   ============================================================= */

'use strict';

(function () {
  const D = window.MAQAM_DATA;
  const S = window.MAQAM_STORE;
  const doc = document;
  const $ = function (sel, root) { return (root || doc).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------------------------------------------------------- */
  /* Small DOM helpers (never inject untrusted strings as HTML) */
  /* ---------------------------------------------------------- */
  function el(tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function svgIcon(id, className) {
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon' + (className ? ' ' + className : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function cleanText(value, max) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  /* ---------------------------------------------------------- */
  /* Toast notifications                                        */
  /* ---------------------------------------------------------- */
  const toastHost = $('#toasts');
  function toast(message, type, options) {
    if (!toastHost) return;
    const opts = options || {};
    const kind = type === 'warn' || type === 'error' ? type : 'success';

    const node = el('div', 'toast toast--' + kind);
    node.setAttribute('role', kind === 'error' ? 'alert' : 'status');

    const iconWrap = el('span', 'toast__icon');
    iconWrap.appendChild(svgIcon(kind === 'success' ? 'i-check' : 'i-info'));
    node.appendChild(iconWrap);

    const body = el('div', 'toast__body');
    body.appendChild(el('p', 'toast__text', message));
    if (opts.href) {
      const link = el('a', 'toast__link', opts.actionLabel || 'فتح الرابط');
      link.href = opts.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      body.appendChild(link);
    }
    node.appendChild(body);

    const close = el('button', 'toast__close');
    close.type = 'button';
    close.setAttribute('aria-label', 'إغلاق التنبيه');
    close.appendChild(svgIcon('i-close'));
    node.appendChild(close);

    toastHost.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('is-visible'); });

    let timer = window.setTimeout(remove, opts.duration || 5200);
    function remove() {
      window.clearTimeout(timer);
      node.classList.remove('is-visible');
      window.setTimeout(function () { node.remove(); }, 320);
    }
    close.addEventListener('click', remove);
    node.addEventListener('mouseenter', function () { window.clearTimeout(timer); });
    node.addEventListener('mouseleave', function () { timer = window.setTimeout(remove, 2600); });
  }

  /* ---------------------------------------------------------- */
  /* WhatsApp helper                                            */
  /* ---------------------------------------------------------- */
  function whatsappUrl(message) {
    return 'https://wa.me/' + D.BRAND.whatsapp + '?text=' + encodeURIComponent(String(message || ''));
  }

  function openWhatsApp(message, label) {
    const url = whatsappUrl(message);
    try {
      const a = doc.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      doc.body.appendChild(a);
      a.click();
      a.remove();
      toast(label || 'تم تجهيز رسالتك على واتساب.', 'success', {
        href: url,
        actionLabel: 'لم يفتح واتساب؟ اضغط هنا',
        duration: 7000
      });
      return true;
    } catch (err) {
      toast('تعذّر فتح واتساب تلقائياً. جرّب الرابط المباشر.', 'error', { href: url, actionLabel: 'فتح واتساب' });
      return false;
    }
  }

  /* ---------------------------------------------------------- */
  /* Preloader + page entrance                                  */
  /* ---------------------------------------------------------- */
  const preloader = $('#preloader');
  let readyDone = false;

  function revealPage() {
    if (readyDone) return;
    readyDone = true;
    doc.body.classList.add('is-ready');
    if (preloader) {
      preloader.classList.add('is-hidden');
      window.setTimeout(function () {
        if (preloader.parentNode) preloader.remove();
      }, 1000);
    }
  }

  if (doc.readyState === 'complete') {
    window.setTimeout(revealPage, 420);
  } else {
    window.addEventListener('load', function () { window.setTimeout(revealPage, 420); });
    // Hard fallback — never trap the user behind the loader.
    window.setTimeout(revealPage, 3000);
  }

  /* ---------------------------------------------------------- */
  /* Header scroll state                                        */
  /* ---------------------------------------------------------- */
  const header = $('#siteHeader');
  let lastScrollState = null;
  function updateHeader() {
    if (!header) return;
    const scrolled = window.scrollY > 28;
    if (scrolled !== lastScrollState) {
      lastScrollState = scrolled;
      header.classList.toggle('is-scrolled', scrolled);
    }
  }

  /* ---------------------------------------------------------- */
  /* Parallax (efficient, disabled for reduced motion/mobile)   */
  /* ---------------------------------------------------------- */
  const parallaxItems = $$('[data-parallax]');
  const allowParallax = !reducedMotion.matches && window.matchMedia('(min-width: 901px)').matches;

  function updateParallax() {
    if (!allowParallax) return;
    const vh = window.innerHeight;
    parallaxItems.forEach(function (item) {
      const rect = item.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const speed = parseFloat(item.getAttribute('data-parallax')) || 0.08;
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      item.style.transform = 'translate3d(0,' + clamp(offset, -90, 90).toFixed(2) + 'px,0)';
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateHeader();
      updateParallax();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    updateHeader();
    updateParallax();
  }, { passive: true });
  updateHeader();
  updateParallax();

  /* ---------------------------------------------------------- */
  /* Hero video (decorative, muted, with graceful fallbacks)    */
  /* ---------------------------------------------------------- */
  const heroVideo = $('.hero__video');
  if (heroVideo) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = !!(connection && connection.saveData);
    const allowVideo = !reducedMotion.matches && !saveData;

    function revealHeroVideo() {
      heroVideo.classList.add('is-ready');
    }

    if (!allowVideo) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
      heroVideo.classList.add('is-disabled');
    } else {
      heroVideo.muted = true;
      heroVideo.setAttribute('muted', '');
      if (heroVideo.readyState >= 2) {
        revealHeroVideo();
      } else {
        heroVideo.addEventListener('loadeddata', revealHeroVideo, { once: true });
      }

      const playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function (err) {
          if (err && (err.name === 'NotAllowedError' || err.name === 'NotSupportedError')) {
            heroVideo.classList.add('is-disabled');
          }
        });
      }

      heroVideo.addEventListener('error', function () {
        heroVideo.classList.add('is-disabled');
      }, { once: true });

      if ('IntersectionObserver' in window) {
        const hero = heroVideo.closest('.hero');
        if (hero) {
          new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (heroVideo.classList.contains('is-disabled')) return;
              if (entry.isIntersecting) {
                // Only resume after the observer itself paused it; the
                // initial play request is handled above.
                if (heroVideo.paused && heroVideo.currentTime > 0) {
                  const resume = heroVideo.play();
                  if (resume && typeof resume.catch === 'function') resume.catch(function () {});
                }
              } else if (!heroVideo.paused) {
                heroVideo.pause();
              }
            });
          }, { threshold: 0.05 }).observe(hero);
        }
      }
    }
  }

  /* ---------------------------------------------------------- */
  /* Reveal-on-scroll                                           */
  /* ---------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');

  // Stagger children inside any [data-stagger] container.
  $$('[data-stagger]').forEach(function (group) {
    const step = parseInt(group.getAttribute('data-stagger'), 10) || 90;
    $$('[data-reveal]', group).forEach(function (child, index) {
      if (!child.hasAttribute('data-delay')) child.setAttribute('data-delay', String(index * step));
    });
  });

  revealEls.forEach(function (item) {
    const delay = parseInt(item.getAttribute('data-delay'), 10);
    if (Number.isFinite(delay) && delay > 0) item.style.transitionDelay = delay + 'ms';
  });

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (item) { item.classList.add('is-in'); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach(function (item) {
      // Anything already in the first viewport reveals immediately.
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        item.classList.add('is-in');
      } else {
        observer.observe(item);
      }
    });
  }

  /* ---------------------------------------------------------- */
  /* Accordions                                                 */
  /* ---------------------------------------------------------- */
  $$('[data-accordion]').forEach(function (item) {
    const trigger = $('.accordion__trigger', item);
    const panel = $('.accordion__panel', item);
    if (!trigger || !panel) return;
    trigger.addEventListener('click', function () {
      const open = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    });
  });

  /* ---------------------------------------------------------- */
  /* Shared overlay state (menu / cart / modal)                 */
  /* ---------------------------------------------------------- */
  const cartDrawer = $('#cartDrawer');
  const drawerOverlay = $('#drawerOverlay');
  const mobileMenu = $('#mobileMenu');
  const quickModal = $('#quickModal');
  let lastFocused = null;
  let activeLayer = null;

  function lockScroll(lock) {
    doc.documentElement.classList.toggle('no-scroll', lock);
    doc.body.classList.toggle('no-scroll', lock);
  }

  function focusables(container) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (node) { return node.offsetWidth > 0 || node.offsetHeight > 0 || node === doc.activeElement; });
  }

  function trapFocus(e, container) {
    if (e.key !== 'Tab' || !container) return;
    const list = focusables(container);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && doc.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && doc.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function rememberFocus() {
    lastFocused = doc.activeElement;
  }

  function restoreFocus() {
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  }

  /* ---------------------------------------------------------- */
  /* Mobile menu                                                */
  /* ---------------------------------------------------------- */
  function openMenu() {
    if (!mobileMenu) return;
    rememberFocus();
    activeLayer = 'menu';
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    const btn = $('[data-menu-open]');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    lockScroll(true);
    const close = $('[data-menu-close]', mobileMenu);
    if (close) window.setTimeout(function () { close.focus(); }, 260);
  }

  function closeMenu(restore) {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    const btn = $('[data-menu-open]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (activeLayer === 'menu') activeLayer = null;
    lockScroll(false);
    if (restore !== false) restoreFocus();
  }

  /* ---------------------------------------------------------- */
  /* Quick-add modal (Turkish coffee customisation)             */
  /* ---------------------------------------------------------- */
  function closeQuickModal(restore) {
    if (!quickModal) return;
    quickModal.classList.remove('is-open');
    quickModal.setAttribute('aria-hidden', 'true');
    if (activeLayer === 'quick') activeLayer = null;
    if (!cartDrawer || !cartDrawer.classList.contains('is-open')) lockScroll(false);
    if (restore !== false) restoreFocus();
  }

  function openQuickAdd(productId) {
    const product = D.getProduct(productId);
    if (!product || !quickModal) return;

    rememberFocus();
    activeLayer = 'quick';

    const panel = $('.modal__panel', quickModal);
    panel.replaceChildren();

    const head = el('div', 'quick__head');
    const media = el('div', 'quick__media');
    media.style.background = product.frame;
    const img = el('img');
    img.src = D.imagePath(product.image);
    img.alt = 'عبوة ' + product.name + ' من مَقام';
    img.width = product.imageWidth;
    img.height = product.imageHeight;
    img.loading = 'lazy';
    media.appendChild(img);
    head.appendChild(media);

    const headText = el('div', 'quick__intro');
    headText.appendChild(el('span', 'kicker', 'تخصيص الطلب'));
    headText.appendChild(el('h2', 'quick__title', product.name));
    headText.appendChild(el('p', 'quick__desc', 'اختر الوزن ودرجة القهوة والهيل، ثم أضفها إلى سلتك.'));
    head.appendChild(headText);
    panel.appendChild(head);

    const form = el('form', 'quick__form');
    form.noValidate = true;

    const result = {
      weight: D.defaultWeight(product).key,
      roast: '',
      cardamom: '',
      qty: 1
    };

    const weightPriceNodes = [];
    let totalNode = null;

    function currentPrice(weightKey) {
      return D.priceFor(product, weightKey, { cardamom: result.cardamom });
    }

    function refreshTotal() {
      if (!totalNode) return;
      totalNode.textContent = D.formatMoney(currentPrice(result.weight) * result.qty);
    }

    function refreshPriceLabels() {
      weightPriceNodes.forEach(function (entry) {
        entry.node.textContent = D.formatMoney(currentPrice(entry.weight));
      });
      refreshTotal();
    }

    /* Weight */
    const weightGroup = el('fieldset', 'option-group');
    weightGroup.appendChild(el('legend', 'option-group__label', 'الوزن'));
    const weightGrid = el('div', 'quick__weights');
    D.weightsFor(product).forEach(function (w) {
      const label = el('label', 'chip-option');
      const input = el('input');
      input.type = 'radio';
      input.name = 'quick-weight';
      input.value = w.key;
      input.checked = w.key === result.weight;
      input.addEventListener('change', function () {
        result.weight = w.key;
        refreshTotal();
      });
      const content = el('span', 'chip-option__content');
      content.appendChild(el('span', 'chip-option__title', w.label));
      const priceNode = el('span', 'chip-option__sub', D.formatMoney(currentPrice(w.key)));
      weightPriceNodes.push({ weight: w.key, node: priceNode });
      content.appendChild(priceNode);
      label.appendChild(input);
      label.appendChild(content);
      weightGrid.appendChild(label);
    });
    weightGroup.appendChild(weightGrid);
    form.appendChild(weightGroup);

    /* Roast + cardamom */
    const groups = [
      { key: 'roast', data: D.TURKISH_OPTIONS.roast, name: 'quick-roast' },
      { key: 'cardamom', data: D.TURKISH_OPTIONS.cardamom, name: 'quick-cardamom' }
    ];

    groups.forEach(function (group) {
      const fs = el('fieldset', 'option-group');
      fs.setAttribute('data-group', group.key);
      const legend = el('legend', 'option-group__label', group.data.label);
      fs.appendChild(legend);
      fs.appendChild(el('p', 'option-group__hint', group.data.hint));
      const pills = el('div', 'pill-options');
      group.data.options.forEach(function (opt) {
        const label = el('label', 'pill-option');
        const input = el('input');
        input.type = 'radio';
        input.name = group.name;
        input.value = opt.value;
        input.addEventListener('change', function () {
          result[group.key] = opt.value;
          fs.classList.remove('is-invalid');
          if (group.key === 'cardamom') refreshPriceLabels();
        });
        label.appendChild(input);
        label.appendChild(el('span', null, opt.label));
        pills.appendChild(label);
      });
      fs.appendChild(pills);
      fs.appendChild(el('p', 'option-group__error', 'يرجى الاختيار لإكمال الطلب'));
      form.appendChild(fs);
    });

    /* Quantity + total */
    const foot = el('div', 'quick__foot');
    const qtyWrap = el('div', 'qty');
    const minus = el('button', 'qty__btn');
    minus.type = 'button';
    minus.setAttribute('aria-label', 'تقليل الكمية');
    minus.appendChild(svgIcon('i-minus'));
    const qtyValue = el('span', 'qty__value', '1');
    qtyValue.setAttribute('aria-live', 'polite');
    const plus = el('button', 'qty__btn');
    plus.type = 'button';
    plus.setAttribute('aria-label', 'زيادة الكمية');
    plus.appendChild(svgIcon('i-plus'));
    qtyWrap.appendChild(minus);
    qtyWrap.appendChild(qtyValue);
    qtyWrap.appendChild(plus);
    foot.appendChild(qtyWrap);

    const totalWrap = el('div', 'quick__total');
    totalWrap.appendChild(el('span', null, 'الإجمالي'));
    totalNode = el('strong', null, D.formatMoney(currentPrice(result.weight) * result.qty));
    totalWrap.appendChild(totalNode);
    foot.appendChild(totalWrap);
    form.appendChild(foot);

    function refreshQty() {
      qtyValue.textContent = String(result.qty);
      refreshTotal();
    }
    minus.addEventListener('click', function () { result.qty = Math.max(1, result.qty - 1); refreshQty(); });
    plus.addEventListener('click', function () { result.qty = Math.min(20, result.qty + 1); refreshQty(); });

    const submit = el('button', 'btn btn--gold quick__submit');
    submit.type = 'submit';
    submit.appendChild(el('span', null, 'أضف إلى السلة'));
    submit.appendChild(svgIcon('i-bag'));
    form.appendChild(submit);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!result.roast || !result.cardamom) {
        groups.forEach(function (group) {
          if (!result[group.key]) {
            const fs = $('[data-group="' + group.key + '"]', form);
            if (fs) fs.classList.add('is-invalid');
          }
        });
        toast('اختر درجة القهوة وإضافة الهيل أولاً.', 'warn');
        return;
      }
      S.add({
        productId: product.id,
        weight: result.weight,
        quantity: result.qty,
        unitPrice: currentPrice(result.weight),
        customizations: { roast: result.roast, cardamom: result.cardamom }
      });
      closeQuickModal(false);
      toast('تمت إضافة ' + product.name + ' إلى السلة.', 'success');
      restoreFocus();
    });

    panel.appendChild(form);

    const closeBtn = el('button', 'modal__close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'إغلاق');
    closeBtn.appendChild(svgIcon('i-close'));
    closeBtn.addEventListener('click', function () { closeQuickModal(); });
    panel.appendChild(closeBtn);

    quickModal.classList.add('is-open');
    quickModal.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    window.setTimeout(function () { closeBtn.focus(); }, 260);
  }

  /* ---------------------------------------------------------- */
  /* Cart drawer                                                */
  /* ---------------------------------------------------------- */
  const cartBody = $('[data-cart-body]');
  const cartFoot = $('[data-cart-foot]');
  const waFallback = $('[data-wa-fallback]');

  function customisationText(item, product) {
    if (!product || !product.customizable || !item.customizations) return '';
    const roast = D.TURKISH_OPTIONS.roast.options.find(function (o) { return o.value === item.customizations.roast; });
    const cardamom = D.TURKISH_OPTIONS.cardamom.options.find(function (o) { return o.value === item.customizations.cardamom; });
    const parts = [];
    if (roast) parts.push(roast.label);
    if (cardamom) parts.push(cardamom.label);
    return parts.join(' · ');
  }

  function buildEmptyState() {
    const wrap = el('div', 'cart-empty');
    const icon = el('span', 'cart-empty__icon');
    icon.appendChild(svgIcon('i-bag'));
    wrap.appendChild(icon);
    wrap.appendChild(el('h3', null, 'سلتك بانتظار أول فنجان'));
    wrap.appendChild(el('p', null, 'لم تُضف أي منتج بعد. اختر خلطتك المفضلة وابدأ الحكاية.'));
    const link = el('a', 'btn btn--dark', 'تصفح المنتجات');
    link.href = 'products.html';
    link.addEventListener('click', function () { closeCart(false); });
    wrap.appendChild(link);
    return wrap;
  }

  function buildCartItem(item) {
    const product = D.getProduct(item.productId);
    if (!product) return null;
    const weight = D.getWeight(item.weight, product);
    const lineTotal = item.unitPrice * item.quantity;

    const article = el('article', 'cart-item');
    article.dataset.key = item.key;

    const mediaLink = el('a', 'cart-item__media');
    mediaLink.href = 'product.html?id=' + encodeURIComponent(product.id);
    mediaLink.setAttribute('aria-label', 'عرض ' + product.name);
    mediaLink.style.background = product.frame;
    const img = el('img');
    img.src = D.imagePath(product.image);
    img.alt = 'عبوة ' + product.name;
    img.loading = 'lazy';
    img.width = product.imageWidth;
    img.height = product.imageHeight;
    mediaLink.appendChild(img);
    article.appendChild(mediaLink);

    const main = el('div', 'cart-item__main');

    const top = el('div', 'cart-item__top');
    const nameLink = el('a', 'cart-item__name', product.name);
    nameLink.href = 'product.html?id=' + encodeURIComponent(product.id);
    top.appendChild(nameLink);

    const remove = el('button', 'cart-item__remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'إزالة ' + product.name + ' من السلة');
    remove.appendChild(svgIcon('i-trash'));
    remove.addEventListener('click', function () {
      article.classList.add('is-removing');
      window.setTimeout(function () {
        S.remove(item.key);
        toast('تمت إزالة ' + product.name + ' من السلة.', 'success');
      }, reducedMotion.matches ? 0 : 230);
    });
    top.appendChild(remove);
    main.appendChild(top);

    const meta = el('div', 'cart-item__meta');
    meta.appendChild(el('span', 'cart-item__weight', weight ? D.weightLabel(weight) : item.weight));
    const customText = customisationText(item, product);
    if (customText) meta.appendChild(el('span', 'cart-item__custom', customText));
    main.appendChild(meta);

    main.appendChild(el('p', 'cart-item__unit', 'سعر الوحدة: ' + D.formatMoney(item.unitPrice)));

    const bottom = el('div', 'cart-item__bottom');
    const qty = el('div', 'qty qty--sm');
    const minus = el('button', 'qty__btn');
    minus.type = 'button';
    minus.setAttribute('aria-label', 'تقليل كمية ' + product.name);
    minus.appendChild(svgIcon('i-minus'));
    minus.addEventListener('click', function () { S.updateQuantity(item.key, item.quantity - 1); });
    const value = el('span', 'qty__value', D.formatNumber(item.quantity));
    value.setAttribute('aria-live', 'polite');
    const plus = el('button', 'qty__btn');
    plus.type = 'button';
    plus.setAttribute('aria-label', 'زيادة كمية ' + product.name);
    plus.appendChild(svgIcon('i-plus'));
    plus.addEventListener('click', function () { S.updateQuantity(item.key, item.quantity + 1); });
    qty.appendChild(minus);
    qty.appendChild(value);
    qty.appendChild(plus);
    bottom.appendChild(qty);
    bottom.appendChild(el('span', 'cart-item__total', D.formatMoney(lineTotal)));
    main.appendChild(bottom);

    article.appendChild(main);
    return article;
  }

  let lastCount = -1;

  function renderCart() {
    const items = S.getItems();
    const count = S.getCount();
    const subtotal = S.getSubtotal();

    $$('[data-cart-count]').forEach(function (badge) {
      badge.textContent = D.formatNumber(count);
      const openBtn = badge.closest('[data-cart-open]');
      if (openBtn) {
        openBtn.setAttribute('aria-label', count === 0
          ? 'فتح سلة التسوق — فارغة'
          : 'فتح سلة التسوق — ' + count + ' منتج');
      }
    });

    $$('[data-cart-count-text]').forEach(function (node) {
      node.textContent = count > 0 ? '(' + D.formatNumber(count) + ')' : '';
    });

    if (lastCount !== count) {
      $$('[data-cart-count]').forEach(function (badge) {
        if (count > 0 && lastCount >= 0) {
          badge.classList.remove('is-pop');
          void badge.offsetWidth;
          badge.classList.add('is-pop');
        }
      });
      lastCount = count;
    }

    if (!cartBody) return;
    cartBody.replaceChildren();

    if (!items.length) {
      cartBody.appendChild(buildEmptyState());
    } else {
      const list = el('div', 'cart-list');
      items.forEach(function (item) {
        const node = buildCartItem(item);
        if (node) list.appendChild(node);
      });
      cartBody.appendChild(list);
    }

    if (cartFoot) cartFoot.hidden = !items.length;

    $$('[data-cart-subtotal]').forEach(function (node) { node.textContent = D.formatMoney(subtotal); });
    $$('[data-cart-total]').forEach(function (node) { node.textContent = D.formatMoney(subtotal); });
  }

  function openCart() {
    if (!cartDrawer) return;
    rememberFocus();
    activeLayer = 'cart';
    renderCart();
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    if (drawerOverlay) drawerOverlay.classList.add('is-visible');
    lockScroll(true);
    const close = $('[data-cart-close]', cartDrawer);
    if (close) window.setTimeout(function () { close.focus(); }, 300);
  }

  function closeCart(restore) {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    if (drawerOverlay) drawerOverlay.classList.remove('is-visible');
    if (activeLayer === 'cart') activeLayer = null;
    if (!quickModal || !quickModal.classList.contains('is-open')) lockScroll(false);
    if (restore !== false) restoreFocus();
  }

  /* ---------------------------------------------------------- */
  /* Global click delegation                                    */
  /* ---------------------------------------------------------- */
  doc.addEventListener('click', function (e) {
    const target = e.target;

    if (target.closest('[data-menu-open]')) { e.preventDefault(); openMenu(); return; }
    if (target.closest('[data-menu-close]')) { e.preventDefault(); closeMenu(); return; }
    if (target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); return; }
    if (target.closest('[data-cart-close]')) { e.preventDefault(); closeCart(); return; }
    if (target === drawerOverlay) { closeCart(); return; }
    if (target.closest('[data-modal-close]')) { closeQuickModal(); return; }

    const addBtn = target.closest('[data-add]');
    if (addBtn) {
      e.preventDefault();
      const id = addBtn.getAttribute('data-add');
      const product = D.getProduct(id);
      if (!product) return;
      if (product.customizable) {
        openQuickAdd(product.id);
      } else {
        const weight = D.defaultWeight(product);
        S.add({
          productId: product.id,
          weight: weight.key,
          quantity: 1,
          unitPrice: D.priceFor(product, weight.key)
        });
        toast('تمت إضافة ' + product.name + ' (' + weight.label + ') إلى السلة.', 'success');
      }
      return;
    }

    const checkoutBtn = target.closest('[data-checkout]');
    if (checkoutBtn) {
      e.preventDefault();
      handleCheckout(checkoutBtn);
    }
  });

  /* Mobile menu links close the menu before navigating/scrolling. */
  if (mobileMenu) {
    $$('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(false); });
    });
  }

  function handleCheckout(btn) {
    if (S.getCount() === 0) {
      toast('سلة التسوق فارغة حالياً. أضف منتجاتك أولاً.', 'warn');
      return;
    }
    btn.classList.add('btn--busy');
    const result = S.checkout();
    window.setTimeout(function () { btn.classList.remove('btn--busy'); }, 900);

    if (result.ok) {
      toast('تم تجهيز طلبك على واتساب. أرسل الرسالة لتأكيد الطلب.', 'success', {
        href: result.url,
        actionLabel: 'لم يفتح واتساب؟ افتح الطلب',
        duration: 8000
      });
      if (waFallback) {
        waFallback.hidden = false;
        const link = $('a', waFallback);
        if (link) link.href = result.url;
      }
    } else if (result.reason === 'empty') {
      toast('سلة التسوق فارغة حالياً. أضف منتجاتك أولاً.', 'warn');
    } else {
      toast('تعذّر فتح واتساب تلقائياً. استخدم الرابط المباشر.', 'error', {
        href: result.url,
        actionLabel: 'فتح واتساب'
      });
    }
  }

  /* ---------------------------------------------------------- */
  /* Keyboard handling                                          */
  /* ---------------------------------------------------------- */
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (quickModal && quickModal.classList.contains('is-open')) { closeQuickModal(); return; }
      if (cartDrawer && cartDrawer.classList.contains('is-open')) { closeCart(); return; }
      if (mobileMenu && mobileMenu.classList.contains('is-open')) { closeMenu(); return; }
    }
    if (quickModal && quickModal.classList.contains('is-open')) {
      trapFocus(e, $('.modal__panel', quickModal));
      return;
    }
    if (cartDrawer && cartDrawer.classList.contains('is-open')) {
      trapFocus(e, cartDrawer);
      return;
    }
    if (mobileMenu && mobileMenu.classList.contains('is-open')) {
      trapFocus(e, mobileMenu);
    }
  });

  /* ---------------------------------------------------------- */
  /* Keep the static featured cards in sync with data.js       */
  /* ---------------------------------------------------------- */
  function hydrateFeaturedCards() {
    $$('#featured .product-card').forEach(function (card) {
      const addBtn = $('[data-add]', card);
      if (!addBtn) return;
      const product = D.getProduct(addBtn.getAttribute('data-add'));
      if (!product) return;

      const media = $('.pc-media', card);
      if (media) {
        media.style.setProperty('--frame', product.frame);
        const index = $('.pc-index', card);
        if (index) index.textContent = String(product.order).padStart(2, '0');
        let custom = $('.pc-custom', card);
        if (product.customizable && !custom) {
          custom = el('span', 'pc-custom', 'تخصيص متاح');
          media.insertBefore(custom, $('img', media));
        } else if (!product.customizable && custom) {
          custom.remove();
        }
        const img = $('img', media);
        if (img) {
          img.src = D.imagePath(product.image);
          img.alt = 'عبوة ' + product.name + ' من مَقام';
          img.width = product.imageWidth;
          img.height = product.imageHeight;
        }
      }

      const category = $('.pc-cat', card);
      if (category) category.textContent = product.categoryLabel;

      const titleLink = $('.pc-title a', card);
      if (titleLink) {
        titleLink.textContent = product.name;
        titleLink.href = 'product.html?id=' + encodeURIComponent(product.id);
      }

      const desc = $('.pc-desc', card);
      if (desc) desc.textContent = product.short;

      const defaultWeight = D.defaultWeight(product);
      const amount = $('.pc-price strong', card);
      if (amount) amount.textContent = D.formatNumber(D.priceFor(product, defaultWeight.key));
      const pricePrefix = $('.pc-price__from', card);
      if (pricePrefix) pricePrefix.textContent = D.weightsFor(product).length === 1 ? defaultWeight.label : 'من';

      const details = $('.pc-actions a', card);
      if (details) details.href = 'product.html?id=' + encodeURIComponent(product.id);
    });
  }

  /* ---------------------------------------------------------- */
  /* Cart data → UI                                             */
  /* ---------------------------------------------------------- */
  window.addEventListener('cart:updated', renderCart);
  renderCart();
  hydrateFeaturedCards();
  if (waFallback) waFallback.hidden = true;

  /* ---------------------------------------------------------- */
  /* Contact form                                               */
  /* ---------------------------------------------------------- */
  const contactForm = $('#contactForm');
  if (contactForm) {
    const nameInput = $('#contactName', contactForm);
    const messageInput = $('#contactMessage', contactForm);
    const nameError = $('#contactNameError');
    const messageError = $('#contactMessageError');
    const status = $('[data-form-status]', contactForm);

    function setError(input, errorNode, message) {
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (errorNode) errorNode.textContent = message;
        return false;
      }
      input.removeAttribute('aria-invalid');
      if (errorNode) errorNode.textContent = '';
      return true;
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!nameInput || !messageInput) return;

      const name = cleanText(nameInput.value, 60);
      const message = String(messageInput.value || '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
        .trim()
        .slice(0, 600);

      const nameOk = setError(nameInput, nameError, name.length < 2 ? 'اكتب اسمك (حرفان على الأقل).' : '');
      const msgOk = setError(messageInput, messageError, message.length < 5 ? 'اكتب رسالتك (٥ أحرف على الأقل).' : '');

      if (!nameOk) { nameInput.focus(); return; }
      if (!msgOk) { messageInput.focus(); return; }

      const text = 'مرحباً مَقام، أنا ' + name + '.\n\n' + message;
      openWhatsApp(text, 'تم تجهيز رسالتك على واتساب.');
      if (status) status.textContent = 'تم تجهيز رسالتك على واتساب — أرسلها لإكمال التواصل.';
    });

    [nameInput, messageInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') {
          input.removeAttribute('aria-invalid');
          const errorNode = input === nameInput ? nameError : messageError;
          if (errorNode) errorNode.textContent = '';
        }
      });
    });
  }

  /* ---------------------------------------------------------- */
  /* Footer year                                                */
  /* ---------------------------------------------------------- */
  $$('[data-year]').forEach(function (node) { node.textContent = String(new Date().getFullYear()); });

  /* ---------------------------------------------------------- */
  /* Internal page transition                                   */
  /* ---------------------------------------------------------- */
  const veil = $('#pageVeil');
  if (veil) {
    doc.addEventListener('click', function (e) {
      if (reducedMotion.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('http') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page
      if (!/\.html$/.test(url.pathname) && url.pathname !== '/') return;

      e.preventDefault();
      doc.body.classList.add('is-leaving');
      veil.classList.add('is-active');
      window.setTimeout(function () { window.location.href = url.href; }, 330);
    });
  }

  /* ---------------------------------------------------------- */
  /* Public UI API                                              */
  /* ---------------------------------------------------------- */
  window.MAQAM_UI = {
    toast: toast,
    openCart: openCart,
    closeCart: closeCart,
    openQuickAdd: openQuickAdd,
    whatsappUrl: whatsappUrl,
    openWhatsApp: openWhatsApp,
    renderCart: renderCart
  };
})();
