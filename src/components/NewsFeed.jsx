import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const SENTIMENT_COLORS = {
  positive: { bg: '#eafaf1', color: '#27ae60', label: '▲ Positive' },
  negative: { bg: '#fdedec', color: '#e74c3c', label: '▼ Negative' },
  neutral: { bg: '#f4f6f7', color: '#888', label: '● Neutral' }
}

const PINNED_COLORS = {
  CENT: '#006e43',
  CENTA: '#006e43'
}

const AUTO_PALETTE = [
  '#e67e22', '#8e44ad', '#2874a6', '#c0392b', '#16a085',
  '#d35400', '#1a5276', '#6c3483', '#117a65', '#784212'
]

const colorCache = {}

function getTickerColor(ticker) {
  if (PINNED_COLORS[ticker]) return PINNED_COLORS[ticker]
  if (colorCache[ticker]) return colorCache[ticker]
  const index = Object.keys(colorCache).length % AUTO_PALETTE.length
  colorCache[ticker] = AUTO_PALETTE[index]
  return colorCache[ticker]
}

function getDateRange(preset) {
  const now = new Date()
  const start = new Date()
  switch (preset) {
    case 'week': start.setDate(now.getDate() - 7); break
    case 'month': start.setMonth(now.getMonth() - 1); break
    case '3months': start.setMonth(now.getMonth() - 3); break
    default: start.setMonth(now.getMonth() - 1)
  }
  return start.toISOString()
}

const PAGE_SIZE = 20

export default function NewsFeed({ activeTicker }) {
  const [articles, setArticles] = useState([])
  const [sentimentFilter, setSentimentFilter] = useState('ALL')
  const [datePreset, setDatePreset] = useState('month')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchArticles = useCallback(async (pageNum = 0, reset = false) => {
    setLoading(true)

    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const since = getDateRange(datePreset)

    let query = supabase
      .from('news_articles')
      .select('*', { count: 'exact' })
      .order('pub_date', { ascending: false })
      .gte('pub_date', since)
      .range(from, to)

    if (activeTicker !== 'ALL') query = query.eq('ticker', activeTicker)
    if (sentimentFilter !== 'ALL') query = query.eq('sentiment', sentimentFilter.toLowerCase())
    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)

    const { data, count } = await query
    const newArticles = data || []

    setArticles(reset ? newArticles : prev => [...prev, ...newArticles])
    setTotal(count || 0)
    setHasMore(from + newArticles.length < (count || 0))
    setLoading(false)
  }, [activeTicker, sentimentFilter, datePreset, search])

  useEffect(() => {
    setPage(0)
    fetchArticles(0, true)
  }, [fetchArticles])

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchArticles(nextPage, false)
  }

  return (
    <div className="card">

      <div className="news-header">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          News Feed {total > 0 && <span className="news-count">({total} articles)</span>}
        </h2>
        <div className="sentiment-filters">
          {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(s => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`sentiment-btn ${sentimentFilter === s ? 'active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Search articles..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="search-input"
      />

      <div className="date-filters">
        {[
          { label: 'This Week', value: 'week' },
          { label: 'This Month', value: 'month' },
          { label: 'Last 3 Months', value: '3months' }
        ].map(preset => (
          <button
            key={preset.value}
            onClick={() => setDatePreset(preset.value)}
            className={`date-btn ${datePreset === preset.value ? 'active' : ''}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {loading && articles.length === 0 ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="articles-list">
          {articles.length === 0 && <p className="loading">No articles found.</p>}
          {articles.map(article => {
            const sentiment = SENTIMENT_COLORS[article.sentiment] || SENTIMENT_COLORS.neutral
            return (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div className="article-card">
                  <div className="article-content">
                    <div className="article-meta">
                      <span
                        className="article-ticker"
                        style={{ background: getTickerColor(article.ticker) }}
                      >
                        {article.ticker}
                      </span>
                      <span className="article-date">
                        {article.pub_date ? new Date(article.pub_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <p className="article-title">{article.title}</p>
                  </div>
                  <span
                    className="sentiment-badge"
                    style={{ background: sentiment.bg, color: sentiment.color }}
                  >
                    {sentiment.label}
                  </span>
                </div>
              </a>
            )
          })}

          {hasMore && (
            <button
              onClick={loadMore}
              className="load-more-btn"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}