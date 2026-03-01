const https = require('https')

const PERIOD_MAP = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '52W': { range: '1y', interval: '1d' },
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const ticker = (req.query.ticker || 'CENT').toUpperCase()
  const rangeKey = (req.query.range || '1M').toUpperCase()
  const { range, interval } = PERIOD_MAP[rangeKey] || PERIOD_MAP['1M']

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}&includePrePost=false`

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        let body = ''
        response.on('data', chunk => body += chunk)
        response.on('end', () => {
          try { resolve(JSON.parse(body)) }
          catch (e) { reject(e) }
        })
      }).on('error', reject)
    })

    const chart = data?.chart?.result?.[0]
    if (!chart) {
      return res.status(500).json({ error: 'No data returned' })
    }

    const timestamps = chart.timestamp || []
    const closes = chart.indicators?.quote?.[0]?.close || []
    const highs = chart.indicators?.quote?.[0]?.high || []
    const lows = chart.indicators?.quote?.[0]?.low || []
    const volumes = chart.indicators?.quote?.[0]?.volume || []

    const result = timestamps.map((ts, i) => {
      const date = new Date(ts * 1000)
      const isIntraday = interval === '5m' || interval === '15m'
      const time = isIntraday
        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : date.toISOString().slice(0, 10)

      return {
        time,
        price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
        high: highs[i] ? parseFloat(highs[i].toFixed(2)) : null,
        low: lows[i] ? parseFloat(lows[i].toFixed(2)) : null,
        volume: volumes[i] || null
      }
    }).filter(d => d.price !== null)

    res.status(200).json(result)

  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}