/* =============================================================
   MAQAM | مَقام — Product cards + catalog filtering
   ============================================================= */

'use strict';

(function () {
  const D = window.MAQAM_DATA;
  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

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

  function createCard(product, index) {
    const card = el('article', 'product-card card-enter');
    card.dataset.product = product.id;
    card.style.animationDelay = Math.min(index, 8) * 55 + 'ms';

    const media = el('div', 'pc-media');
    media.style.setProperty('--frame', product.frame);

    const number = el('span', 'pc-index', String(product.order).padStart(2, '0'));
    media.appendChild(number);

    if (product.customizable) {
      media.appendChild(el('span', 'pc-custom', 'تخصيص متاح'));
    }

    const img = el('img');
    img.src = D.imagePath(product.image);
    img.alt = 'عبوة ' + product.name + ' من مَقام';
    img.width = product.imageWidth;
    img.height = product.imageHeight;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);
    card.appendChild(media);

    const body = el('div', 'pc-body');
    body.appendChild(el('span', 'pc-cat', product.categoryLabel));

    const title = el('h3', 'pc-title');
    const titleLink = el('a', null, product.name);
    titleLink.href = 'product.html?id=' + encodeURIComponent(product.id);
    title.appendChild(titleLink);
    body.appendChild(title);

    body.appendChild(el('p', 'pc-desc', product.short));

    const foot = el('div', 'pc-foot');
    const price = el('span', 'pc-price');
    const defaultWeight = D.defaultWeight(product);
    const pricePrefix = D.weightsFor(product).length === 1 ? defaultWeight.label : 'من';
    price.appendChild(el('span', 'pc-price__from', pricePrefix));
    const amount = el('strong', null, D.formatNumber(D.priceFor(product, defaultWeight.key)));
    price.appendChild(amount);
    price.appendChild(el('span', null, D.BRAND.currency));
    foot.appendChild(price);
    body.appendChild(foot);

    const actions = el('div', 'pc-actions');

    const addBtn = el('button', 'btn btn--dark');
    addBtn.type = 'button';
    addBtn.setAttribute('data-add', product.id);
    addBtn.appendChild(icon('i-bag'));
    addBtn.appendChild(el('span', null, 'أضف للسلة'));
    actions.appendChild(addBtn);

    const details = el('a', 'btn btn--outline', 'عرض التفاصيل');
    details.href = 'product.html?id=' + encodeURIComponent(product.id);
    actions.appendChild(details);

    body.appendChild(actions);
    card.appendChild(body);
    return card;
  }

  window.MAQAM_CARDS = { create: createCard };

  /* ---------------------------------------------------------- */
  /* Catalog page                                               */
  /* ---------------------------------------------------------- */
  const grid = $('#productGrid');
  if (!grid) return;

  const countNode = $('[data-catalog-count]');
  const emptyNode = $('#catalogEmpty');
  const searchInput = $('#productSearch');
  const sortSelect = $('#productSort');
  const chips = $$('.chip[data-filter]');

  const state = {
    filter: 'all',
    query: '',
    sort: 'featured'
  };

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .trim();
  }

  function filteredProducts() {
    const q = normalize(state.query);
    let list = D.PRODUCTS.filter(function (product) {
      if (state.filter !== 'all' && product.category !== state.filter) return false;
      if (!q) return true;
      const haystack = normalize(
        product.name + ' ' + product.categoryLabel + ' ' + product.short + ' ' + product.description
      );
      return haystack.indexOf(q) !== -1;
    });

    list = list.slice();
    if (state.sort === 'price-asc') {
      list.sort(function (a, b) {
        return D.priceFor(a, D.defaultWeight(a).key) - D.priceFor(b, D.defaultWeight(b).key);
      });
    } else if (state.sort === 'price-desc') {
      list.sort(function (a, b) {
        return D.priceFor(b, D.defaultWeight(b).key) - D.priceFor(a, D.defaultWeight(a).key);
      });
    } else if (state.sort === 'name') {
      list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ar'); });
    } else {
      list.sort(function (a, b) { return a.order - b.order; });
    }
    return list;
  }

  function render() {
    const list = filteredProducts();

    const fragment = document.createDocumentFragment();
    list.forEach(function (product, index) {
      fragment.appendChild(createCard(product, index));
    });
    grid.replaceChildren(fragment);
    grid.hidden = list.length === 0;

    if (countNode) {
      countNode.textContent = 'عدد المنتجات: ' + D.formatNumber(list.length);
    }
    if (emptyNode) {
      emptyNode.classList.toggle('is-visible', list.length === 0);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.filter = chip.getAttribute('data-filter') || 'all';
      chips.forEach(function (other) {
        const active = other === chip;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      state.query = searchInput.value.slice(0, 40);
      render();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      const value = sortSelect.value;
      state.sort = ['featured', 'price-asc', 'price-desc', 'name'].indexOf(value) !== -1 ? value : 'featured';
      render();
    });
  }

  const resetBtn = $('[data-reset-filters]');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      state.filter = 'all';
      state.query = '';
      state.sort = 'featured';
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'featured';
      chips.forEach(function (chip) {
        const active = chip.getAttribute('data-filter') === 'all';
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      render();
      if (searchInput) searchInput.focus();
    });
  }

  render();
})();
