import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const SENTIMENT_COLORS = {
  positive: { bg: '#eafaf1', color: '#27ae60', label: '▲ Positive' },
  negative: { bg: '#fdedec', color: '#e74c3c', label: '▼ Negative' },
  neutral: { bg: '#f4f6f7', color: '#888', label: '● Neutral' }
}

const TICKER_COLORS = {
  CENT: '#1a5276',
  CENTA: '#2874a6',
  SMG: '#e67e22'
}

export default function NewsFeed({ activeTicker }) {
  const [articles, setArticles] = useState([])
  const [sentimentFilter, setSentimentFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [activeTicker])

  async function fetchArticles() {
    setLoading(true)

    let query = supabase
      .from('news_articles')
      .select('*')
      .order('pub_date', { ascending: false })
      .limit(50)

    if (activeTicker !== 'ALL') {
      query = query.eq('ticker', activeTicker)
    }

    const { data } = await query
    setArticles(data || [])
    setLoading(false)
  }

  const filtered = sentimentFilter === 'ALL'
    ? articles
    : articles.filter(a => a.sentiment === sentimentFilter.toLowerCase())

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>News Feed</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(s => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              style={{
                padding: '5px 14px',
                borderRadius: '14px',
                border: '1px solid #ddd',
                background: sentimentFilter === s ? '#2874a6' : 'white',
                color: sentimentFilter === s ? 'white' : '#555',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="loading">Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 && <p className="loading">No articles found.</p>}
          {filtered.map(article => {
            const sentiment = SENTIMENT_COLORS[article.sentiment] || SENTIMENT_COLORS.neutral
           return (
            <a key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
            >
                <div style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: '#fafafa',
                  border: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'white',
                        background: TICKER_COLORS[article.ticker],
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>{article.ticker}</span>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>
                        {article.pub_date ? new Date(article.pub_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#1a1a2e', fontWeight: 500, lineHeight: 1.5 }}>{article.title}</p>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: sentiment.bg,
                    color: sentiment.color,
                    whiteSpace: 'nowrap'
                  }}>{sentiment.label}</span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}