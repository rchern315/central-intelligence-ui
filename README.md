# Central Intelligence UI

This repository contains the frontend for the Central Intelligence application.

Production site:

https://central-intelligence-ui.vercel.app/

## Architecture

The application uses two active repositories:

### `central-intelligence-dashboard`

Backend data pipeline.

It:

- fetches RSS news
- scores article sentiment
- fetches stock data
- writes processed data to Supabase
- runs through GitHub Actions

### `central-intelligence-ui`

Frontend application.

It:

- reads articles from Supabase
- reads stock data from Supabase
- displays news, filters, sentiment, prices, and charts
- deploys through Vercel

## Data Flow

```text
Yahoo Finance / Google News
            ↓
central-intelligence-dashboard
            ↓
         Supabase
            ↓
central-intelligence-ui
            ↓
          Vercel
```

The frontend does not read RSS feeds directly.

## News Feed

The news component is:

```text
src/components/NewsFeed.jsx
```

It reads from the Supabase table:

```text
news_articles
```

Articles are ordered by `pub_date` newest-first and can be filtered by:

- ticker
- sentiment
- date range
- title search

If new articles are missing from the UI, check the backend pipeline first:

```text
central-intelligence-dashboard
    ↓
GitHub Actions
    ↓
Supabase news_articles
    ↓
central-intelligence-ui
```

## Stock Data

Stock information is displayed by:

```text
src/components/StockPrices.jsx
```

Stock data is stored in Supabase by the backend pipeline.

## Environment Variables

The frontend uses public Supabase client settings:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

An example is provided in:

```text
.env-example
```

Never place the Supabase service-role key or Anthropic API key in this frontend repository.

Those server-side secrets belong only in the backend GitHub Actions configuration.

## Local Development

### Windows PowerShell

Clone the repository:

```powershell
git clone https://github.com/rchern315/central-intelligence-ui.git
cd central-intelligence-ui
```

Install dependencies:

```powershell
npm install
```

Create a local environment file with:

```text
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the local development server:

```powershell
npm run dev
```

## Build

Create a production build with:

```powershell
npm run build
```

## Deployment

Vercel deploys this repository as the frontend application.

Production:

https://central-intelligence-ui.vercel.app/

## Troubleshooting Missing News

If an article exists in an RSS source but does not appear on the website:

1. Check the `central-intelligence-dashboard` GitHub Actions pipeline.
2. Confirm the RSS source returned HTTP 200.
3. Confirm the pipeline found article nodes.
4. Confirm the article was inserted into Supabase.
5. Check the `news_articles` table.
6. Confirm the article's `pub_date` falls within the selected UI date filter.
7. Refresh the Vercel application.

The frontend does not ingest RSS by itself.
