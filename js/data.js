/* =============================================================
   MAQAM | مَقام — Central product configuration
   -------------------------------------------------------------
   ⚠️  PRICES / الأسعار
   The prices below are clearly-marked CONFIGURABLE PLACEHOLDERS.
   Replace the numbers inside each product's `prices` object with
   the official prices. Nothing else needs to change: the whole
   site (cards, details, cart, WhatsApp message) reads from here.
   ============================================================= */

'use strict';

window.MAQAM_DATA = (function () {
  const BRAND = {
    nameAr: 'مَقام',
    nameEn: 'MAQAM',
    tagline: 'لكل قهوة حكاية... ولكل حكاية مَقام',
    whatsapp: '201220300708',
    whatsappDisplay: '+20 122 030 0708',
    currency: 'ج.م',
    currencyCode: 'EGP'
  };

  /* Central weight configuration — shared by every product. */
  const WEIGHTS = [
    { key: '250', label: 'ربع كيلو', grams: 250, short: '250 جم' },
    { key: '500', label: 'نصف كيلو', grams: 500, short: '500 جم' },
    { key: '1000', label: 'كيلو', grams: 1000, short: '1000 جم' }
  ];

  /* Some products are sold as one fixed package instead of three weights. */
  const PACKAGE_WEIGHT = { key: 'package', label: 'العبوة', grams: null, short: 'عبوة واحدة' };

  const CATEGORIES = [
    { id: 'all', label: 'الكل' },
    { id: 'turkish', label: 'قهوة تركية' },
    { id: 'french', label: 'قهوة فرنسية' },
    { id: 'arabic', label: 'قهوة عربية' },
    { id: 'special', label: 'خلطات خاصة' }
  ];

  /* Turkish-coffee-only customisation groups. */
  const TURKISH_OPTIONS = {
    roast: {
      label: 'اختر درجة القهوة',
      hint: 'درجة التحميص والطحن كما تحبها',
      options: [
        { value: 'light', label: 'سادة فاتح' },
        { value: 'medium', label: 'سادة وسط' },
        { value: 'dark', label: 'سادة غامق' }
      ]
    },
    cardamom: {
      label: 'إضافة الهيل',
      hint: 'يُضاف 50 ج.م للربع، و100 للنصف، و200 للكيلو عند اختيار بالهيل.',
      options: [
        { value: 'with', label: 'بالهيل' },
        { value: 'without', label: 'بدون هيل' }
      ]
    }
  };

  /* -----------------------------------------------------------
     PRODUCTS
     `frame` is the average edge colour of each packaging photo;
     it lets `object-fit: contain` blend seamlessly into the card
     while preserving the real aspect ratio of the image.

     The five non-square source photos use card-ready 1000×1000
     derivatives in assets/img/products/ (originals stay in /products).
     ----------------------------------------------------------- */
  const PRODUCTS = [
    {
      id: 'turkish',
      name: 'قهوة تركية',
      category: 'turkish',
      categoryLabel: 'قهوة تركية',
      order: 1,
      featured: true,
      image: 'قهوة تركي.png',
      imageWidth: 631,
      imageHeight: 636,
      frame: '#CBB096',
      short: 'خلطة القهوة التركية الأصيلة، مع إمكانية إضافة الهيل المحمص الفواح.',
      description:
        'هي الإسم الأول الذي ارتبط باسم بن العميد، فهي مزيج من القهوة الشقراء والسوداء المحمصة والمطحونة بعناية مع إمكانية إضافة الهيل المحمص الفواح، لتعيش تجربة فريدة خاصة بمحبي القهوة الأصلية.',
      prices: { 250: 500, 500: 1000, 1000: 2000 },
      surcharges: {
        cardamom: {
          with: { 250: 50, 500: 100, 1000: 200 }
        }
      },
      customizable: true
    },
    {
      id: 'french',
      name: 'قهوة فرنسية',
      category: 'french',
      categoryLabel: 'قهوة فرنسية',
      order: 2,
      featured: true,
      image: 'قهوة فرنسية.png',
      imageWidth: 630,
      imageHeight: 630,
      frame: '#C4AC90',
      short: 'خلطة غنية من القهوة الشقراء والمبيض اللذيذ، ترافقك في اللحظات المميزة.',
      description:
        'خلطة غنية من القهوة الشقراء والمبيض اللذيذ، ترافقك في اللحظات المميزة كي تنعش يومك.',
      prices: { 250: 500, 500: 1000, 1000: 2000 },
      customizable: false
    },
    {
      id: 'french-hazelnut',
      name: 'قهوة فرنسية بالبندق',
      category: 'french',
      categoryLabel: 'قهوة فرنسية',
      order: 3,
      featured: false,
      image: 'قهوة فرنسية بندق.png',
      imageWidth: 1254,
      imageHeight: 1254,
      frame: '#C9B194',
      short: 'قهوة شقراء ومبيض قهوة لذيذ، مع لمسة بندق دافئة.',
      description:
        'مزيج من القهوة المحمصة الشقراء مع مبيض القهوة اللذيذ ونكهة البندق.',
      prices: { 250: 550, 500: 1100, 1000: 2200 },
      customizable: false
    },
    {
      id: 'french-mastic',
      name: 'قهوة فرنسية بالمستكة',
      category: 'french',
      categoryLabel: 'قهوة فرنسية',
      order: 4,
      featured: false,
      image: 'assets/img/products/french-mastic-square.jpg',
      imageWidth: 1000,
      imageHeight: 1000,
      frame: '#BDA288',
      short: 'تحميص خفيف ومبيض غني، مع نكهة المستكة المميزة.',
      description:
        'مزيج من القهوة المحمصة الخفيفة مع مبيض القهوة اللذيذ ونكهة المستكة.',
      prices: { 250: 550, 500: 1100, 1000: 2200 },
      customizable: false
    },
    {
      id: 'royal-arabic',
      name: 'قهوة عربية ملكية',
      category: 'arabic',
      categoryLabel: 'قهوة عربية',
      order: 5,
      featured: true,
      image: 'assets/img/products/royal-arabic-square.jpg',
      imageWidth: 1000,
      imageHeight: 1000,
      frame: '#BC956F',
      short: 'قهوة عربية شقراء، هيل فاخر، حليب غني ونكهة زعفران مميزة.',
      description:
        'الطعم الملكي الراقي، ننتجها بفخر من مزيج القهوة العربية الشقراء مع الهيل الفاخر والحليب الغني مع نكهة خاصة من الزعفران المميز بجودته.',
      prices: { 250: 600, 500: 1200, 1000: 2400 },
      customizable: false
    },
    {
      id: 'torino',
      name: 'قهوة تورينو',
      category: 'special',
      categoryLabel: 'خلطات خاصة',
      order: 6,
      featured: true,
      image: 'assets/img/products/torino-square.jpg',
      imageWidth: 1000,
      imageHeight: 1000,
      frame: '#765333',
      short: 'شوكولاتة، حليب، ودارسين فاخر في وصفة عالية الرفاهية.',
      description:
        'وصفة خاصة للرفاهية وطعم مميز لمحبي الشوكولاتة الممزوجة مع القهوة الشقراء والحليب الغني مع نكهة خاصة من الدارسين الفاخر تغني حواسك وتأخذك بعيداً.',
      prices: { 250: 560, 500: 1120, 1000: 2240 },
      customizable: false
    },
    {
      id: 'nella',
      name: 'كوفي نيلا',
      category: 'special',
      categoryLabel: 'خلطات خاصة',
      order: 7,
      featured: false,
      image: 'assets/img/products/nella-square.jpg',
      imageWidth: 1000,
      imageHeight: 1000,
      frame: '#6F4629',
      short: 'قهوة شقراء، مبيض قهوة، شوكولاتة وفانيلا.',
      description: 'قهوة شقراء، مبيض قهوة، شوكولاتة وفانيلا.',
      prices: { 250: 560, 500: 1120, 1000: 2240 },
      customizable: false
    },
    {
      id: 'drip',
      name: 'قهوة مقطرة',
      category: 'special',
      categoryLabel: 'خلطات خاصة',
      order: 8,
      featured: false,
      image: 'assets/img/products/drip-square.jpg',
      imageWidth: 1000,
      imageHeight: 1000,
      frame: '#B19AA4',
      short: 'تحميص هادئ وطحن مناسب للتحضير المقطّر، لفنجان صافٍ متوازن.',
      description:
        'قهوة مقطرة بخلطة مختارة تمنحك فنجاناً صافياً بنكهة متوازنة، مناسبة للتحضير المقطّر ولمحبي القهوة اليومية الهادئة.',
      prices: { package: 850 },
      weights: [PACKAGE_WEIGHT],
      customizable: false
    },
    {
      id: 'greek',
      name: 'قهوة يونانية',
      category: 'special',
      categoryLabel: 'خلطات خاصة',
      order: 9,
      featured: false,
      image: 'assets/img/products/greek-square.jpg',
      imageWidth: 1000,
      imageHeight: 1000,
      frame: '#5E391A',
      short: 'قهوة شقراء بمبيض غني ونكهة جوز الهند، لمذاق رفاهية لا يتكرر.',
      description:
        'مزيج راقي من القهوة الشقراء والمبيض الغني مضافاً إليه نكهة جوز الهند، التي تمنحك الشعور برفاهية ومتعة لا تتكرر.',
      prices: { 250: 530, 500: 1060, 1000: 1120 },
      customizable: false
    }
  ];

  const numberFormat = new Intl.NumberFormat('en-US');

  function formatMoney(value) {
    const n = Number(value);
    return numberFormat.format(Number.isFinite(n) ? n : 0) + ' ' + BRAND.currency;
  }

  function formatNumber(value) {
    return numberFormat.format(Number(value) || 0);
  }

  function getProduct(id) {
    return PRODUCTS.find(function (p) { return p.id === id; }) || null;
  }

  function getWeight(key, product) {
    return weightsFor(product).find(function (w) { return w.key === String(key); }) || null;
  }

  function weightsFor(product) {
    if (product && Array.isArray(product.weights) && product.weights.length) return product.weights;
    return WEIGHTS;
  }

  function defaultWeight(product) {
    return weightsFor(product)[0] || WEIGHTS[0];
  }

  function weightLabel(weight) {
    if (!weight) return '';
    return weight.short ? weight.label + ' (' + weight.short + ')' : weight.label;
  }

  /* Product image paths. Most originals live in the untouched /products
     folder (Arabic filenames & spaces → encoded). The five non-square
     source photos have square, card-ready derivatives in assets/img/products. */
  function imagePath(file) {
    const value = String(file || '');
    if (value.indexOf('/') !== -1) return value;
    return 'products/' + encodeURIComponent(value);
  }

  function priceFor(product, weightKey, customizations) {
    if (!product || !product.prices) return 0;

    let price = Number(product.prices[weightKey]) || 0;
    if (!product.surcharges || !customizations || typeof customizations !== 'object') {
      return price;
    }

    Object.keys(product.surcharges).forEach(function (groupKey) {
      const choice = customizations[groupKey];
      if (choice === undefined || choice === null || choice === '') return;

      const rules = product.surcharges[groupKey];
      if (!rules || typeof rules !== 'object') return;

      const rule = rules[choice];
      if (rule === undefined || rule === null) return;

      if (typeof rule === 'number') {
        price += rule;
      } else if (typeof rule === 'object') {
        const extra = Number(rule[weightKey]);
        if (Number.isFinite(extra)) price += extra;
      }
    });

    return price;
  }

  return {
    BRAND: BRAND,
    WEIGHTS: WEIGHTS,
    CATEGORIES: CATEGORIES,
    TURKISH_OPTIONS: TURKISH_OPTIONS,
    PRODUCTS: PRODUCTS,
    formatMoney: formatMoney,
    formatNumber: formatNumber,
    getProduct: getProduct,
    getWeight: getWeight,
    weightsFor: weightsFor,
    defaultWeight: defaultWeight,
    weightLabel: weightLabel,
    imagePath: imagePath,
    priceFor: priceFor
  };
})();
