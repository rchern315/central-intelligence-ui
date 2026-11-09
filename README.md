# Central Intelligence UI

The front end for Central Intelligence, a dashboard that tracks market news, article sentiment, and stock prices.

**Live site:** https://central-intelligence-ui.vercel.app/

## How it fits together

Central Intelligence is split into two repos. A separate back-end pipeline (`central-intelligence-dashboard`) runs on a schedule in GitHub Actions. It pulls news from RSS feeds, scores each article's sentiment, fetches stock data, and writes everything to Supabase.

This repo is the React app that reads from Supabase and displays it. It never reads the RSS feeds directly, so if new articles aren't showing up, check the pipeline first.

```text
News feeds + stock data
          ↓
Pipeline (GitHub Actions)
          ↓
       Supabase
          ↓
   This app (Vercel)
```

## The main pieces

- **News feed** (`src/components/NewsFeed.jsx`) reads from the `news_articles` table, newest first. You can filter by ticker, sentiment, and date range, or search titles.
- **Stock prices** (`src/components/StockPrices.jsx`) shows the stock data the pipeline stores in Supabase.

## Run it locally

```bash
git clone https://github.com/rchern315/central-intelligence-ui.git
cd central-intelligence-ui
npm install
```

Create a `.env` file with your Supabase project URL and public anon key (see `.env-example`):

```text
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then run `npm run dev`. To build for production, run `npm run build`.

Only public client settings belong in this repo. The Supabase service-role key and the AI API key for sentiment scoring live in the pipeline's GitHub Actions secrets, never here.

Vercel deploys this repo automatically.
