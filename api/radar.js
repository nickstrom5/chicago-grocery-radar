// Single function behind every /api/* route (see vercel.json rewrites).
// Serves SAMPLE data only: every response carries `sample: true` until a real
// circular source is wired in. Shapes match what public/index.html reads.

const STORES = {
  ALDI: { color: '#5aa9e6' },
  "Woodman's": { color: '#e0b04a' },
  'Jewel-Osco': { color: '#e5645a' },
  "Mariano's": { color: '#9bd06b' },
};

const ZIPS = [
  { zip: '60614', label: 'Lincoln Park' },
  { zip: '60657', label: 'Lakeview' },
  { zip: '60622', label: 'Wicker Park' },
  { zip: '60647', label: 'Logan Square' },
  { zip: '60640', label: 'Uptown' },
];

// Typical shelf prices, used for the staple book and for deal verdicts.
const STAPLES = [
  { name: 'Large eggs, dozen', prices: { ALDI: 2.49, "Woodman's": 2.79, 'Jewel-Osco': 3.99, "Mariano's": 3.79 } },
  { name: 'Whole milk, gallon', prices: { ALDI: 2.95, "Woodman's": 3.19, 'Jewel-Osco': 4.29, "Mariano's": 3.99 } },
  { name: 'Boneless chicken breast, lb', prices: { ALDI: 2.99, "Woodman's": 2.89, 'Jewel-Osco': 4.99, "Mariano's": 4.49 } },
  { name: 'Bananas, lb', prices: { ALDI: 0.25, "Woodman's": 0.49, 'Jewel-Osco': 0.69, "Mariano's": 0.65 } },
  { name: 'Red seedless grapes, lb', prices: { ALDI: 2.29, "Woodman's": 1.99, 'Jewel-Osco': 3.49, "Mariano's": 2.99 } },
  { name: 'White bread, 20 oz', prices: { ALDI: 1.39, "Woodman's": 1.69, 'Jewel-Osco': 2.99, "Mariano's": 2.79 } },
  { name: 'Ground beef 80/20, lb', prices: { ALDI: 4.49, "Woodman's": 4.29, 'Jewel-Osco': 5.99, "Mariano's": 5.49 } },
  { name: 'Butter, 1 lb', prices: { ALDI: 3.69, "Woodman's": 3.99, 'Jewel-Osco': 5.49, "Mariano's": 4.99 } },
];

// Sample "this week's ad" items per store.
const ADS = {
  ALDI: [
    { name: 'Large eggs, dozen', price: 1.99 },
    { name: 'Red seedless grapes, lb', price: 1.49 },
    { name: 'Boneless chicken breast, lb', price: 2.79 },
    { name: 'Avocados, each', price: 0.59 },
  ],
  "Woodman's": [
    { name: 'Boneless chicken breast, lb', price: 1.99 },
    { name: 'Whole milk, gallon', price: 2.89 },
    { name: 'Ground beef 80/20, lb', price: 3.99 },
    { name: 'Strawberries, 1 lb', price: 2.49 },
  ],
  'Jewel-Osco': [
    { name: 'Large eggs, dozen', price: 2.99 },
    { name: 'Butter, 1 lb', price: 3.49 },
    { name: 'Red seedless grapes, lb', price: 1.97 },
    { name: 'Cereal, family size', price: 2.99 },
  ],
  "Mariano's": [
    { name: 'Boneless chicken breast, lb', price: 2.49 },
    { name: 'Bananas, lb', price: 0.49 },
    { name: 'White bread, 20 oz', price: 1.99 },
    { name: 'Salmon fillet, lb', price: 8.99 },
  ],
};

const indexedItems = () => Object.values(ADS).reduce((n, items) => n + items.length, 0);

function verdict(store, name, price) {
  const staple = STAPLES.find(s => s.name === name);
  const typical = staple && staple.prices[store];
  if (!typical) return null;
  if (price <= typical * 0.8) return { tone: 'great', label: 'great price' };
  if (price < typical) return { tone: '', label: 'below typical' };
  return null;
}

function search(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = name => words.every(w => name.toLowerCase().includes(w));
  const results = [];
  for (const [store, items] of Object.entries(ADS)) {
    for (const item of items) {
      if (!matches(item.name)) continue;
      results.push({ store, name: item.name, price: item.price, source: 'sample', store_meta: STORES[store], verdict: verdict(store, item.name, item.price) });
    }
  }
  results.sort((a, b) => a.price - b.price);
  return results;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = (req, res) => {
  // Rewrites keep the original URL, so route on the requested path.
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const zip = url.searchParams.get('zip') || ZIPS[0].zip;
  const base = { sample: true };

  switch (route) {
    case 'health':
      return send(res, 200, { ...base, ok: true, service: 'chicago-grocery-radar' });
    case 'meta':
      return send(res, 200, { ...base, stores: STORES, zips: ZIPS });
    case 'warmup':
      return send(res, 200, { ...base, ok: true, zip, indexed_items: indexedItems(), refreshed: url.searchParams.get('refresh') === '1' });
    case 'flyers':
      return send(res, 200, { ...base, zip, flyers: Object.entries(ADS).map(([store, items]) => ({ store, items: items.length })) });
    case 'search': {
      const q = (url.searchParams.get('q') || '').trim();
      if (q.length < 2) return send(res, 400, { ...base, error: 'q must be at least 2 characters' });
      const results = search(q);
      const low = results.length ? results[0].price : null;
      return send(res, 200, { ...base, zip, q, indexed_items: indexedItems(), summary: { low, live_hits: 0 }, results });
    }
    case 'sales':
      return send(res, 200, { ...base, zip, stores: Object.entries(ADS).map(([store, deals]) => ({ store, deals: [...deals].sort((a, b) => a.price - b.price) })) });
    case 'staples':
      return send(res, 200, { ...base, items: STAPLES });
    default:
      return send(res, 404, { ...base, error: `unknown route: ${url.pathname}` });
  }
};
