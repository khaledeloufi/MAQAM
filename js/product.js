/* =============================================================
   MAQAM | مَقام — Product details page
   ============================================================= */

'use strict';

(function () {
  const D = window.MAQAM_DATA;
  const S = window.MAQAM_STORE;
  const UI = window.MAQAM_UI;
  const Cards = window.MAQAM_CARDS;

  const $ = function (sel, root) { return (root || document).querySelector(sel); };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function icon(id) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  const root = $('#pdpRoot');
  const notFound = $('#productNotFound');
  const breadcrumb = $('[data-breadcrumb]');
  const relatedSection = $('#relatedSection');
  const relatedGrid = $('#relatedGrid');
  const stickyBuy = $('#stickyBuy');
  const stickyName = $('[data-sticky-name]');
  const stickyPrice = $('[data-sticky-price]');
  const stickyAdd = $('[data-sticky-add]');

  if (!root) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const product = D && D.getProduct ? D.getProduct(id) : null;

  if (!product) {
    root.hidden = true;
    if (notFound) notFound.hidden = false;
    if (breadcrumb) breadcrumb.textContent = 'غير متاح';
    document.title = 'المنتج غير متاح | مَقام MAQAM';
    if (stickyBuy) stickyBuy.hidden = true;
    return;
  }

  // Update page meta
  document.title = product.name + ' | مَقام MAQAM';
  if (breadcrumb) breadcrumb.textContent = product.name;
  const metaDesc = $('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', product.short);

  /* ---------------------------------------------------------- */
  /* State                                                      */
  /* ---------------------------------------------------------- */
  const productWeights = D.weightsFor(product);
  const isSingleWeight = productWeights.length === 1;

  let state = {
    weight: D.defaultWeight(product).key,
    qty: 1,
    roast: '',
    cardamom: ''
  };

  function unitPrice() {
    return D.priceFor(product, state.weight, { cardamom: state.cardamom });
  }

  function total() {
    return unitPrice() * state.qty;
  }

  /* ---------------------------------------------------------- */
  /* Build UI                                                   */
  /* ---------------------------------------------------------- */
  function render() {
    const pdp = el('div', 'pdp');

    // Media column
    const mediaCol = el('div', 'pdp__media');
    const frame = el('div', 'pdp__frame');
    frame.style.setProperty('--frame', product.frame);
    const img = el('img', 'pdp__img');
    img.src = D.imagePath(product.image);
    img.alt = 'عبوة ' + product.name + ' من مَقام';
    img.width = product.imageWidth;
    img.height = product.imageHeight;
    img.decoding = 'async';
    img.fetchPriority = 'high';
    frame.appendChild(img);
    mediaCol.appendChild(frame);

    const caption = el('div', 'pdp__caption');
    caption.appendChild(el('span', null, 'صورة المنتج الفعلية'));
    caption.appendChild(el('span', 'en', 'MAQAM · ' + (product.categoryLabel || '')));
    mediaCol.appendChild(caption);
    pdp.appendChild(mediaCol);

    // Info column
    const info = el('div', 'pdp__info');
    info.appendChild(el('span', 'pdp__cat', product.categoryLabel));
    info.appendChild(el('h1', 'pdp__title', product.name));
    info.appendChild(el('p', 'pdp__desc', product.description));

    // Price row
    const priceRow = el('div', 'pdp__price-row');
    const priceMain = el('div');
    priceMain.appendChild(el('span', 'pdp__price-label', 'سعر الوحدة'));
    const priceValue = el('div', 'pdp__price', D.formatMoney(unitPrice()));
    priceValue.id = 'pdpPrice';
    priceMain.appendChild(priceValue);
    priceRow.appendChild(priceMain);
    priceRow.appendChild(el('p', 'pdp__price-note', isSingleWeight
      ? 'سعر العبوة الواحدة. يُؤكَّد السعر النهائي عبر واتساب.'
      : 'السعر يتغيّر حسب الوزن المختار. يُؤكَّد السعر النهائي عبر واتساب.'));
    info.appendChild(priceRow);

    // Weight options
    const weightBlock = buildWeightBlock();
    info.appendChild(weightBlock);

    // Turkish customization
    let roastGroup = null;
    let cardamomGroup = null;
    if (product.customizable) {
      roastGroup = buildPillBlock('roast', D.TURKISH_OPTIONS.roast.label, D.TURKISH_OPTIONS.roast.options, 'مطلوب', 'درجة القهوة');
      cardamomGroup = buildPillBlock('cardamom', D.TURKISH_OPTIONS.cardamom.label, D.TURKISH_OPTIONS.cardamom.options, D.TURKISH_OPTIONS.cardamom.hint, 'إضافة الهيل');
      info.appendChild(roastGroup.block);
      info.appendChild(cardamomGroup.block);
    }

    // Buy row (qty + total)
    const buyRow = el('div', 'pdp__buy-row');
    const qtyWrap = el('div', 'qty');
    const decBtn = el('button', 'qty__btn');
    decBtn.type = 'button';
    decBtn.setAttribute('aria-label', 'تقليل الكمية');
    decBtn.appendChild(icon('i-minus'));
    const qtyVal = el('span', 'qty__value', '1');
    qtyVal.id = 'pdpQty';
    const incBtn = el('button', 'qty__btn');
    incBtn.type = 'button';
    incBtn.setAttribute('aria-label', 'زيادة الكمية');
    incBtn.appendChild(icon('i-plus'));
    qtyWrap.appendChild(decBtn);
    qtyWrap.appendChild(qtyVal);
    qtyWrap.appendChild(incBtn);
    buyRow.appendChild(qtyWrap);

    const totalWrap = el('div', 'pdp__total');
    totalWrap.appendChild(el('span', 'pdp__total-label', 'الإجمالي'));
    const totalValue = el('div', 'pdp__total-value', D.formatMoney(total()));
    totalValue.id = 'pdpTotal';
    totalWrap.appendChild(totalValue);
    buyRow.appendChild(totalWrap);
    info.appendChild(buyRow);

    // Actions
    const actions = el('div', 'pdp__actions');
    const addBtn = el('button', 'btn btn--dark btn--block');
    addBtn.type = 'button';
    addBtn.id = 'addToCartBtn';
    addBtn.appendChild(icon('i-bag'));
    addBtn.appendChild(el('span', null, 'أضف للسلة'));
    actions.appendChild(addBtn);

    const waBtn = el('button', 'btn btn--outline btn--block');
    waBtn.type = 'button';
    waBtn.id = 'waInquiryBtn';
    waBtn.appendChild(icon('i-whatsapp'));
    waBtn.appendChild(el('span', null, 'استفسر عن هذا المنتج عبر واتساب'));
    actions.appendChild(waBtn);
    info.appendChild(actions);

    // Meta
    const meta = el('div', 'pdp__meta');
    meta.appendChild(metaItem('i-leaf', 'تغليف محكم يحفظ النكهة والقوام.'));
    meta.appendChild(metaItem('i-whatsapp', 'تأكيد الطلب والسعر والتفاصيل عبر واتساب.'));
    meta.appendChild(metaItem('i-bag', isSingleWeight ? 'متوفر بعبوة واحدة.' : 'أوزان متعددة: ربع، نصف، أو كيلو.'));
    info.appendChild(meta);

    // Accordions
    const acc1 = buildAccordion('عن هذا المنتج', product.description, true);
    const acc2 = buildAccordion('التخزين والتقديم', 'يُحفظ في مكان بارد وجاف بعيداً عن الرطوبة والحرارة وأشعة الشمس المباشرة، ويُغلق بإحكام بعد الفتح للحفاظ على النكهة. حضّر فنجانك بالطريقة التي تناسب ذوقك وطقسك.');
    const acc3 = buildAccordion('الطلب والتوصيل', 'نستقبل طلبك عبر واتساب، ونؤكد معك الكميات والتخصيص والسعر النهائي وتفاصيل التوصيل والدفع قبل التنفيذ.');
    info.appendChild(acc1);
    info.appendChild(acc2);
    info.appendChild(acc3);

    pdp.appendChild(info);
    root.replaceChildren(pdp);

    /* -------------------------------------------------------- */
    /* Interactions                                             */
    /* -------------------------------------------------------- */
    function updateWeightPrices() {
      const priceNodes = weightBlock.querySelectorAll('[data-weight-price]');
      Array.prototype.forEach.call(priceNodes, function (node) {
        const key = node.getAttribute('data-weight-price');
        node.textContent = D.formatMoney(D.priceFor(product, key, { cardamom: state.cardamom }));
      });
    }

    function updateDisplay() {
      updateWeightPrices();
      if (priceValue) priceValue.textContent = D.formatMoney(unitPrice());
      if (totalValue) totalValue.textContent = D.formatMoney(total());
      if (stickyPrice) stickyPrice.textContent = D.formatMoney(total());
    }

    // Weight radios
    const weightInputs = weightBlock.querySelectorAll('input[name="weight"]');
    Array.prototype.forEach.call(weightInputs, function (input) {
      input.addEventListener('change', function () {
        state.weight = input.value;
        updateDisplay();
      });
    });

    // Turkish radios
    if (roastGroup) {
      Array.prototype.forEach.call(roastGroup.inputs, function (input) {
        input.addEventListener('change', function () {
          state.roast = input.value;
          roastGroup.block.classList.remove('is-invalid');
        });
      });
    }
    if (cardamomGroup) {
      Array.prototype.forEach.call(cardamomGroup.inputs, function (input) {
        input.addEventListener('change', function () {
          state.cardamom = input.value;
          cardamomGroup.block.classList.remove('is-invalid');
          updateDisplay();
        });
      });
    }

    // Quantity
    decBtn.addEventListener('click', function () {
      if (state.qty > 1) {
        state.qty -= 1;
        qtyVal.textContent = D.formatNumber(state.qty);
        updateDisplay();
      }
    });
    incBtn.addEventListener('click', function () {
      if (state.qty < 20) {
        state.qty += 1;
        qtyVal.textContent = D.formatNumber(state.qty);
        updateDisplay();
      }
    });

    // Add to cart
    addBtn.addEventListener('click', function () {
      if (product.customizable) {
        let invalid = false;
        if (!state.roast && roastGroup) {
          roastGroup.block.classList.add('is-invalid');
          invalid = true;
        }
        if (!state.cardamom && cardamomGroup) {
          cardamomGroup.block.classList.add('is-invalid');
          invalid = true;
        }
        if (invalid) {
          if (UI) UI.toast('يرجى اختيار درجة القهوة وإضافة الهيل لإتمام الطلب.', 'warn');
          const first = info.querySelector('.option-block.is-invalid');
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const customizations = product.customizable ? {
        roast: state.roast,
        cardamom: state.cardamom
      } : null;

      S.add({
        productId: product.id,
        weight: state.weight,
        quantity: state.qty,
        unitPrice: unitPrice(),
        customizations: customizations
      });

      if (UI) UI.toast('تمت إضافة "' + product.name + '" إلى السلة.', 'success');

      // Brief button feedback
      addBtn.classList.add('btn--busy');
      const label = addBtn.querySelector('span:last-child');
      const prev = label ? label.textContent : '';
      if (label) label.textContent = 'تمت الإضافة';
      setTimeout(function () {
        addBtn.classList.remove('btn--busy');
        if (label) label.textContent = prev || 'أضف للسلة';
      }, 1400);
    });

    // WhatsApp inquiry
    waBtn.addEventListener('click', function () {
      const lines = [];
      const weight = D.getWeight(state.weight, product);
      lines.push('مرحباً مَقام، أود الاستفسار عن المنتج التالي:');
      lines.push('');
      lines.push('- اسم المنتج: ' + product.name);
      lines.push('- الوزن: ' + (weight ? D.weightLabel(weight) : state.weight));
      lines.push('- الكمية: ' + D.formatNumber(state.qty));
      if (product.customizable) {
        if (state.roast) lines.push('- درجة القهوة: ' + state.roast);
        if (state.cardamom) lines.push('- إضافة الهيل: ' + state.cardamom);
      }
      lines.push('- سعر الوحدة: ' + D.formatMoney(unitPrice()));
      lines.push('- الإجمالي: ' + D.formatMoney(total()));
      lines.push('');
      lines.push('برجاء تأكيد التفاصيل. شكراً لكم.');
      if (UI) UI.openWhatsApp(lines.join('\n'), 'تم تجهيز استفسارك على واتساب.');
    });
  }

  /* ---------------------------------------------------------- */
  /* Builders                                                   */
  /* ---------------------------------------------------------- */
  function buildWeightBlock() {
    const block = el('div', 'option-block');
    const head = el('div', 'option-block__head');
    head.appendChild(el('span', 'option-block__title', isSingleWeight ? 'حجم العبوة' : 'اختر الوزن'));
    head.appendChild(el('span', 'option-block__hint', isSingleWeight ? 'متوفر بعبوة واحدة' : 'متوفر بثلاثة أوزان'));
    block.appendChild(head);

    const weights = el('div', 'weights' + (isSingleWeight ? ' weights--single' : ''));
    productWeights.forEach(function (w, i) {
      const label = el('label', 'weight-option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'weight';
      input.value = w.key;
      if (i === 0) input.checked = true;
      const box = el('span', 'weight-option__box');
      box.appendChild(el('span', 'weight-option__label', w.label));
      const priceNode = el('span', 'weight-option__price', D.formatMoney(D.priceFor(product, w.key)));
      priceNode.setAttribute('data-weight-price', w.key);
      box.appendChild(priceNode);
      label.appendChild(input);
      label.appendChild(box);
      weights.appendChild(label);
    });
    block.appendChild(weights);
    return block;
  }

  function buildPillBlock(name, title, options, hint, errorLabel) {
    const block = el('div', 'option-block');
    block.setAttribute('data-option', name);
    const head = el('div', 'option-block__head');
    head.appendChild(el('span', 'option-block__title', title));
    head.appendChild(el('span', 'option-block__hint', hint || ''));
    block.appendChild(head);

    const pills = el('div', 'pill-options');
    const inputs = [];
    options.forEach(function (opt) {
      const label = el('label', 'pill-option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'pdp-' + name;
      input.value = opt.value;
      const span = el('span', null, opt.label);
      label.appendChild(input);
      label.appendChild(span);
      pills.appendChild(label);
      inputs.push(input);
    });
    block.appendChild(pills);
    block.appendChild(el('p', 'option-block__error', 'يرجى اختيار ' + errorLabel + '.'));
    return { block: block, inputs: inputs };
  }

  function metaItem(iconId, text) {
    const item = el('div', 'pdp__meta-item');
    item.appendChild(icon(iconId));
    item.appendChild(el('span', null, text));
    return item;
  }

  function buildAccordion(title, content, open) {
    const acc = el('div', 'accordion' + (open ? ' is-open' : ''));
    const trigger = el('button', 'accordion__trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    trigger.appendChild(el('span', null, title));
    const iconSpan = el('span', 'accordion__icon');
    iconSpan.setAttribute('aria-hidden', 'true');
    trigger.appendChild(iconSpan);

    const panel = el('div', 'accordion__panel');
    const inner = el('div', 'accordion__inner', content);
    panel.appendChild(inner);
    if (open) panel.style.maxHeight = 'none';

    trigger.addEventListener('click', function () {
      const isOpen = acc.classList.contains('is-open');
      if (isOpen) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        // force reflow then collapse
        panel.offsetHeight; // eslint-disable-line no-unused-expressions
        panel.style.maxHeight = '0px';
        acc.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        acc.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        const onEnd = function () {
          if (acc.classList.contains('is-open')) panel.style.maxHeight = 'none';
          panel.removeEventListener('transitionend', onEnd);
        };
        panel.addEventListener('transitionend', onEnd);
      }
    });

    // set initial open height after paint
    if (open) {
      requestAnimationFrame(function () {
        panel.style.maxHeight = 'none';
      });
    }

    acc.appendChild(trigger);
    acc.appendChild(panel);
    return acc;
  }

  /* ---------------------------------------------------------- */
  /* Related products                                           */
  /* ---------------------------------------------------------- */
  function renderRelated() {
    if (!relatedSection || !relatedGrid || !Cards) return;
    const pool = D.PRODUCTS.filter(function (p) { return p.id !== product.id; });
    const same = pool.filter(function (p) { return p.category === product.category; });
    const others = pool.filter(function (p) { return p.category !== product.category; });
    const related = same.concat(others).slice(0, 3);
    if (!related.length) return;

    const frag = document.createDocumentFragment();
    related.forEach(function (p, i) {
      frag.appendChild(Cards.create(p, i));
    });
    relatedGrid.replaceChildren(frag);
    relatedSection.hidden = false;
  }

  /* ---------------------------------------------------------- */
  /* Sticky buy                                                 */
  /* ---------------------------------------------------------- */
  function initSticky() {
    if (!stickyBuy) return;
    if (stickyName) stickyName.textContent = product.name;
    if (stickyPrice) stickyPrice.textContent = D.formatMoney(total());
    stickyBuy.hidden = false;
    if (stickyAdd) {
      stickyAdd.addEventListener('click', function () {
        const mainAdd = $('#addToCartBtn');
        if (mainAdd) {
          mainAdd.click();
          mainAdd.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  // Run
  render();
  renderRelated();
  initSticky();
})();