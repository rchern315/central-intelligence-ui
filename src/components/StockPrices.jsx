import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'

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

const TIME_RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', '52W']

const PERIOD_MAP = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '52W': { range: '1y', interval: '1d' },
}

export default function StockPrices({ activeTicker }) {
  const [latest, setLatest] = useState([])
  const [chartData, setChartData] = useState([])
  const [timeRange, setTimeRange] = useState('1M')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  const tickers = useMemo(
    () => activeTicker === 'ALL' ? ['CENT', 'CENTA', 'SMG'] : [activeTicker],
    [activeTicker]
  )

  // Fetch latest prices from Supabase for the price cards
  useEffect(() => {
    async function fetchLatest() {
      const { data } = await supabase
        .from('stock_prices')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(20)

      if (!data) return

      const latestMap = {}
      data.forEach(row => {
        if (!latestMap[row.ticker]) latestMap[row.ticker] = row
      })

      setLatest(Object.values(latestMap).filter(s => tickers.includes(s.ticker)))
      setLoading(false)
    }
    fetchLatest()
  }, [tickers])

  // Fetch historical data via Vite proxy (dev) or serverless function (prod)
  const fetchChartData = useCallback(async () => {
    setChartLoading(true)

    const { range, interval } = PERIOD_MAP[timeRange] || PERIOD_MAP['1M']

    try {
      const promises = tickers.map(ticker => {
        const isProd = import.meta.env.PROD
        const url = isProd
          ? `/api/stock-history.cjs?ticker=${ticker}&range=${timeRange}`
          : `/yahoo-finance/v8/finance/chart/${ticker}?range=${range}&interval=${interval}&includePrePost=false`

        return fetch(url, isProd ? {} : { headers: { 'User-Agent': 'Mozilla/5.0' } })
          .then(r => r.json())
          .then(data => {
            if (isProd) {
              return { ticker, data }
            }

            // Parse Yahoo Finance response directly in dev
            const chart = data?.chart?.result?.[0]
            if (!chart) return { ticker, data: [] }

            const timestamps = chart.timestamp || []
            const closes = chart.indicators?.quote?.[0]?.close || []

            const points = timestamps.map((ts, i) => {
              const date = new Date(ts * 1000)
              const isIntraday = interval === '5m' || interval === '15m'
              return {
                time: isIntraday
                  ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : date.toISOString().slice(0, 10),
                price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null
              }
            }).filter(d => d.price !== null)

            return { ticker, data: points }
          })
      })

      const results = await Promise.all(promises)

      // Merge all ticker data by time
      const merged = {}
      results.forEach(({ ticker, data }) => {
        if (!Array.isArray(data)) return
        data.forEach(point => {
          if (!merged[point.time]) merged[point.time] = { time: point.time }
          merged[point.time][ticker] = point.price
        })
      })

      setChartData(Object.values(merged))
    } catch (e) {
      console.error('Chart fetch error:', e)
    }

    setChartLoading(false)
  }, [tickers, timeRange])

  useEffect(() => {
    fetchChartData()
  }, [fetchChartData])

  // Calculate 52W high/low for reference lines
  const get52WStats = (ticker) => {
    const prices = chartData.map(d => d[ticker]).filter(Boolean)
    if (!prices.length) return null
    return {
      high: Math.max(...prices),
      low: Math.min(...prices)
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">Stock Prices</h2>

      {/* Price cards */}
      {loading ? <p className="loading">Loading...</p> : (
        <div className="stock-cards">
          {latest.map(stock => (
            <div
              key={stock.ticker}
              className="stock-card"
              style={{ borderLeft: `4px solid ${getTickerColor(stock.ticker)}` }}
            >
              <div className="stock-card-ticker">{stock.ticker}</div>
              <div className="stock-card-price">${stock.price?.toFixed(2)}</div>
              <div className={`stock-card-change ${stock.change_pct >= 0 ? 'positive' : 'negative'}`}>
                {stock.change_pct >= 0 ? '▲' : '▼'} {Math.abs(stock.change_pct?.toFixed(2))}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time range filters */}
      <div className="time-range-filters">
        {TIME_RANGES.map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`date-btn ${timeRange === range ? 'active' : ''}`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartLoading ? <p className="loading">Loading chart...</p> : (
        <>
          {timeRange === '52W' && tickers.length === 1 && get52WStats(tickers[0]) && (
            <div className="week52-stats">
              <span>52W High: <strong>${get52WStats(tickers[0]).high.toFixed(2)}</strong></span>
              <span>52W Low: <strong>${get52WStats(tickers[0]).low.toFixed(2)}</strong></span>
            </div>
          )}

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                tickFormatter={val => {
                  if (timeRange === '1D' || timeRange === '5D') return val.split(' ')[1] || val
                  return val.slice(5)
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
                tickFormatter={val => `$${val}`}
              />
              <Tooltip
                formatter={(val, name) => [`$${val}`, name]}
                labelFormatter={label => label}
              />
              <Legend />
              {tickers.map(ticker => (
                <Line
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  stroke={getTickerColor(ticker)}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
              {timeRange === '52W' && tickers.length === 1 && get52WStats(tickers[0]) && (
                <>
                  <ReferenceLine y={get52WStats(tickers[0]).high} stroke="#27ae60" strokeDasharray="4 4" label={{ value: '52W High', fontSize: 10, fill: '#27ae60' }} />
                  <ReferenceLine y={get52WStats(tickers[0]).low} stroke="#e74c3c" strokeDasharray="4 4" label={{ value: '52W Low', fontSize: 10, fill: '#e74c3c' }} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
