import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

export default function StockPrices({ activeTicker }) {
  const [data, setData] = useState([])
  const [latest, setLatest] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStockData()
  }, [activeTicker])

  async function fetchStockData() {
    setLoading(true)

    let query = supabase
      .from('stock_prices')
      .select('*')
      .order('fetched_at', { ascending: true })
      .limit(200)

    if (activeTicker !== 'ALL') {
      query = query.eq('ticker', activeTicker)
    }

    const { data: rows } = await query
    if (!rows) return

    // Build chart data grouped by timestamp
    const grouped = {}
    rows.forEach(row => {
      const time = new Date(row.fetched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!grouped[time]) grouped[time] = { time }
      grouped[time][row.ticker] = row.price
    })

    setData(Object.values(grouped))

    // Get latest price per ticker
    const latestMap = {}
    rows.forEach(row => {
      latestMap[row.ticker] = row
    })
    setLatest(Object.values(latestMap))
    setLoading(false)
  }

  const tickers = activeTicker === 'ALL' ? ['CENT', 'CENTA', 'SMG'] : [activeTicker]

  return (
    <div className="card">
      <h2 className="section-title">Stock Prices</h2>

      {loading ? <p className="loading">Loading...</p> : (
        <>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {latest.map(stock => (
              <div key={stock.ticker} style={{
                padding: '16px 24px',
                borderRadius: '10px',
                background: '#f8f9fa',
                borderLeft: `4px solid ${getTickerColor(stock.ticker)}`
              }}>
                <div style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>{stock.ticker}</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a2e' }}>${stock.price?.toFixed(2)}</div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: stock.change_pct >= 0 ? '#27ae60' : '#e74c3c'
                }}>
                  {stock.change_pct >= 0 ? '▲' : '▼'} {Math.abs(stock.change_pct?.toFixed(2))}%
                </div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              {tickers.map(ticker => (
                <Line
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  stroke={getTickerColor(ticker)}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}