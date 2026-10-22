# Chicago Grocery Radar

A phone-first dashboard comparing weekly grocery ads and typical shelf prices across Chicago stores (ALDI, Woodman's, Jewel-Osco and Mariano's) by neighborhood ZIP code. It flags whether a sale price is actually a deal.

Live at **[chicago-grocery-radar.vercel.app](https://chicago-grocery-radar.vercel.app)**.

> **Status: prototype.** The API currently serves **sample data**. Every response includes `"sample": true` until a real weekly-ad source is connected. The response shapes are final, so the front end won't need changes when that happens.

## How it works

```
public/index.html   the dashboard: one page, no framework, no build step
api/radar.js        one Vercel serverless function behind every /api/* route
api/hello.js        a trivial health check
vercel.json         rewrites /api/{health,meta,warmup,flyers,search,sales,staples} to radar.js
```

| Endpoint | Returns |
| --- | --- |
| `/api/meta` | Stores, colors and the ZIP codes covered |
| `/api/flyers` | Each store's weekly ad items |
| `/api/sales` | Ad items compared with typical shelf prices |
| `/api/staples` | A price book of everyday staples across stores |
| `/api/search?q=` | Search across ad items |
| `/api/health`, `/api/warmup` | Uptime checks |

Every route takes an optional `?zip=` (defaults to 60614, Lincoln Park).

## Run it locally

```bash
npx vercel dev
```

Then open <http://localhost:3000>.

## License

MIT. See [LICENSE](LICENSE).
