/* =============================================================
   MAQAM | مَقام — Shopping cart (localStorage + WhatsApp checkout)
   ============================================================= */

'use strict';

(function () {
  const STORAGE_KEY = 'maqam_cart_v1';
  const VALID_IDS = new Set(window.MAQAM_DATA.PRODUCTS.map(function (p) { return p.id; }));
  const VALID_ROAST = new Set(window.MAQAM_DATA.TURKISH_OPTIONS.roast.options.map(function (o) { return o.value; }));
  const VALID_CARDAMOM = new Set(window.MAQAM_DATA.TURKISH_OPTIONS.cardamom.options.map(function (o) { return o.value; }));

  function toStr(v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); }

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  function sanitizeItem(raw) {
    if (!isObj(raw)) return null;
    const productId = toStr(raw.productId);
    if (!VALID_IDS.has(productId)) return null;

    const product = window.MAQAM_DATA.getProduct(productId);
    if (!product) return null;

    const weight = toStr(raw.weight);
    if (!window.MAQAM_DATA.getWeight(weight, product)) return null;

    // Turkish coffee must always carry its two required choices.
    let customizations = null;
    if (product.customizable) {
      if (!raw.customizations || !isObj(raw.customizations)) return null;
      const roast = toStr(raw.customizations.roast);
      const cardamom = toStr(raw.customizations.cardamom);
      if (!VALID_ROAST.has(roast) || !VALID_CARDAMOM.has(cardamom)) return null;
      customizations = { roast: roast, cardamom: cardamom };
    }

    // Prices are always re-derived from the central config — never
    // trusted from localStorage or from an arbitrary caller. The
    // customisations are passed in so weight-based surcharges apply.
    const unit = window.MAQAM_DATA.priceFor(product, weight, customizations);
    if (!Number.isFinite(unit) || unit < 0) return null;

    const qty = parseInt(raw.quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) return null;

    const out = {
      key: '',
      productId: productId,
      weight: weight,
      quantity: Math.min(qty, 20),
      unitPrice: unit
    };

    if (customizations) out.customizations = customizations;
    return out;
  }

  function load() {
    let cleaned = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(function (r) {
            const it = sanitizeItem(r);
            if (!it) return;
            it.key = buildKey(it.productId, it.weight, it.customizations);
            const duplicate = cleaned.find(function (other) { return other.key === it.key; });
            if (duplicate) {
              duplicate.quantity = Math.min(20, duplicate.quantity + it.quantity);
            } else {
              cleaned.push(it);
            }
          });
        }
      }
    } catch (e) {
      // Corrupted or unavailable storage — start clean.
      cleaned = [];
    }
    // Persist the sanitised version so damaged/tampered entries cannot
    // come back on the next load and so every item always has a key.
    save(cleaned);
    return cleaned;
  }

  function save(items) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* localStorage unavailable — cart will still work for this session. */
    }
  }

  let items = load();

  function emit() {
    window.dispatchEvent(new CustomEvent('cart:updated', {
      detail: {
        items: items.slice(),
        count: getCount(),
        subtotal: getSubtotal()
      }
    }));
  }

  function buildKey(productId, weight, customizations) {
    let key = productId + '|' + weight;
    if (customizations && customizations.roast && customizations.cardamom) {
      key += '|' + customizations.roast + '|' + customizations.cardamom;
    }
    return key;
  }

  function addProduct(opts) {
    const productId = toStr(opts && opts.productId);
    const weight = toStr(opts && opts.weight);

    if (!VALID_IDS.has(productId)) return false;

    const product = window.MAQAM_DATA.getProduct(productId);
    if (!product) return false;
    if (!window.MAQAM_DATA.getWeight(weight, product)) return false;

    const quantity = parseInt(opts && opts.quantity, 10) || 1;

    let customizations = null;
    if (product.customizable) {
      if (!opts || !opts.customizations) return false;
      const roast = toStr(opts.customizations.roast);
      const cardamom = toStr(opts.customizations.cardamom);
      if (!VALID_ROAST.has(roast) || !VALID_CARDAMOM.has(cardamom)) return false;
      customizations = { roast: roast, cardamom: cardamom };
    }

    const unitPrice = window.MAQAM_DATA.priceFor(product, weight, customizations);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return false;

    const key = buildKey(productId, weight, customizations);
    const existing = items.find(function (it) { return it.key === key; });
    if (existing) {
      existing.quantity = Math.min(20, existing.quantity + Math.max(1, quantity));
      existing.unitPrice = unitPrice;
    } else {
      const item = {
        key: key,
        productId: productId,
        weight: weight,
        quantity: Math.min(20, Math.max(1, quantity)),
        unitPrice: unitPrice
      };
      if (customizations) item.customizations = customizations;
      items.push(item);
    }
    save(items);
    emit();
    return true;
  }

  function updateQuantity(key, quantity) {
    const q = parseInt(quantity, 10);
    const idx = items.findIndex(function (it) { return it.key === key; });
    if (idx === -1) return;
    if (!Number.isFinite(q) || q <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = Math.min(20, q);
    }
    save(items);
    emit();
  }

  function removeItem(key) {
    items = items.filter(function (it) { return it.key !== key; });
    save(items);
    emit();
  }

  function clear() {
    items = [];
    save(items);
    emit();
  }

  function getItems() { return items.slice(); }

  function getCount() {
    return items.reduce(function (sum, it) { return sum + (Number(it.quantity) || 0); }, 0);
  }

  function getSubtotal() {
    return items.reduce(function (sum, it) {
      return sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
    }, 0);
  }

  /* Build a rich Arabic WhatsApp order message from the cart. */
  function buildOrderMessage() {
    const D = window.MAQAM_DATA;
    const lines = [];
    lines.push('مرحباً مَقام، أريد تأكيد الطلب التالي:');
    lines.push('');
    lines.push('تفاصيل الطلب:');

    items.forEach(function (it, idx) {
      const product = D.getProduct(it.productId);
      const weight = D.getWeight(it.weight, product);
      const name = product ? product.name : it.productId;
      const weightLabel = weight ? D.weightLabel(weight) : it.weight;

      lines.push('');
      lines.push((idx + 1) + '. ' + name);
      lines.push('- الوزن: ' + weightLabel);
      lines.push('- الكمية: ' + D.formatNumber(it.quantity));

      // Turkish-coffee customisations — only when applicable.
      if (product && product.customizable && it.customizations) {
        const roastOpt = D.TURKISH_OPTIONS.roast.options.find(function (o) { return o.value === it.customizations.roast; });
        const cardOpt = D.TURKISH_OPTIONS.cardamom.options.find(function (o) { return o.value === it.customizations.cardamom; });
        if (roastOpt) lines.push('- درجة القهوة: ' + roastOpt.label);
        if (cardOpt) lines.push('- إضافة الهيل: ' + cardOpt.label);
      }

      lines.push('- سعر الوحدة: ' + D.formatMoney(it.unitPrice));
      lines.push('- إجمالي المنتج: ' + D.formatMoney(it.unitPrice * it.quantity));
    });

    lines.push('');
    lines.push('إجمالي الطلب: ' + D.formatMoney(getSubtotal()));
    lines.push('');
    lines.push('برجاء تأكيد الطلب وتفاصيل الاستلام. شكراً لكم.');

    return lines.join('\n');
  }

  function checkoutUrl() {
    const phone = window.MAQAM_DATA.BRAND.whatsapp;
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(buildOrderMessage());
  }

  /* Opens WhatsApp in a new tab with a pre-filled order.
     Returns the generated URL so the UI can always offer a manual
     fallback link if a popup blocker interferes. The cart is NEVER
     cleared here — the customer keeps their order intact. */
  function checkout() {
    if (items.length === 0) return { ok: false, reason: 'empty', url: '' };

    const url = checkoutUrl();
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return { ok: true, reason: 'opened', url: url };
    } catch (e) {
      return { ok: false, reason: 'failed', url: url };
    }
  }

  window.MAQAM_STORE = {
    add: addProduct,
    updateQuantity: updateQuantity,
    remove: removeItem,
    clear: clear,
    getItems: getItems,
    getCount: getCount,
    getSubtotal: getSubtotal,
    buildOrderMessage: buildOrderMessage,
    checkoutUrl: checkoutUrl,
    checkout: checkout
  };
})();
