// Post-build step: adds <title>, description and structured data to the exported HTML.
// Done after `expo export` (not via +html.tsx) so Expo's own script/preload injection is untouched.
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const SITE = 'https://ecomstack.online';
const DESC = 'Free e-commerce calculators: profit and break-even ROAS, FX and cross-border landed cost, and overhead break-even tracking.';

const PAGES = {
  index: { path: '/', title: 'Merchant Toolkit | Profit, FX & Overhead Calculators for E-Commerce', desc: DESC },
  profit: {
    path: '/profit',
    title: 'Profit & Break-Even ROAS Calculator | Merchant Toolkit',
    desc: 'Free profit calculator for e-commerce: break-even ROAS, target CPA, net profit and margin.',
  },
  fx: {
    path: '/fx',
    title: 'FX & Cross-Border Tax Calculator | Merchant Toolkit',
    desc: 'Free FX and cross-border calculator: landed cost with exchange rate, customs duty, VAT/GST and payout.',
  },
  expenses: {
    path: '/expenses',
    title: 'Expense & Overhead Tracker | Merchant Toolkit',
    desc: 'Free expense and overhead tracker with monthly burn and break-even volume for online stores.',
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'Merchant Toolkit', inLanguage: 'en', image: `${SITE}/icon-512.png` },
    {
      '@type': 'WebApplication',
      name: 'Merchant Toolkit',
      url: `${SITE}/`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any (web browser)',
      description: DESC,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ],
}).replace(/</g, '\\u003c');

// Profit-calculator schema (previously in src/app/+html.tsx, which breaks Expo's script injection).
const profitApp = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE}/profit#app`,
  name: 'Shopify Profit Calculator',
  alternateName: 'EcomStack Profit Calculator',
  url: `${SITE}/profit`,
  description:
    'Free Shopify profit calculator. Enter price, COGS, shipping, payment gateway fees and ad spend to get net profit, net margin, break-even ROAS and target CPA instantly.',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'E-commerce profit calculator',
  operatingSystem: 'Web, iOS, Android',
  browserRequirements: 'Requires JavaScript',
  inLanguage: 'en',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  featureList: [
    'Net profit and net margin calculation',
    'Break-even ROAS calculation',
    'Target CPA calculation',
    'Payment gateway fee modelling (percentage + fixed fee)',
    'Shipping charged vs. shipping cost',
    'Units sold or clicks-times-conversion volume modes',
    'Saved product presets stored on your device',
  ],
  audience: { '@type': 'Audience', audienceType: 'Shopify merchants, dropshippers and e-commerce marketers' },
  publisher: { '@type': 'Organization', name: 'EcomStack', url: SITE },
}).replace(/</g, '\\u003c');

for (const [name, p] of Object.entries(PAGES)) {
  const file = path.join(dist, `${name}.html`);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('data-seo="1"')) continue; // already processed
  html = html.replace(/<title>[\s\S]*?<\/title>/, '');
  html = html.replace(/<link rel="icon" href="\/favicon\.ico"\/>/, ''); // replaced by the full icon set below
  const tags = [
    `<title data-seo="1">${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.desc)}"/>`,
    `<link rel="canonical" href="${SITE}${p.path === '/' ? '/' : p.path}"/>`,
    // Icons: Google needs a favicon whose size is a multiple of 48px; the generated .ico is only 16/32px.
    `<link rel="icon" href="/favicon.ico" sizes="any"/>`,
    `<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"/>`,
    `<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png"/>`,
    `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"/>`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>`,
    `<meta property="og:image" content="${SITE}/icon-512.png"/>`,
    `<meta property="og:site_name" content="Merchant Toolkit"/>`,
    `<meta property="og:title" content="${esc(p.title)}"/>`,
    `<meta property="og:description" content="${esc(p.desc)}"/>`,
    `<meta property="og:url" content="${SITE}${p.path}"/>`,
    `<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site summary"/>`,
    `<script type="application/ld+json">${jsonLd}</script>`,
    // "/" now renders the profit calculator too, so both get its schema.
    ...(name === 'profit' || name === 'index' ? [`<script type="application/ld+json">${profitApp}</script>`] : []),
  ].join('');
  if (!html.includes('</head>')) throw new Error(`${name}.html has no </head>`);
  fs.writeFileSync(file, html.replace('</head>', `${tags}</head>`), 'utf8');
  console.log(`SEO tags added: ${name}.html`);
}
