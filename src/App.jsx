import { useState } from 'react'
import StockPrices from './components/StockPrices'
import NewsFeed from './components/NewsFeed'
import './App.css'

function App() {
  const [activeTicker, setActiveTicker] = useState('ALL')

  const tickers = ['ALL', 'CENT', 'CENTA', 'SMG']

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>Central Garden & Pet Intelligence — AI-Powered Competitive Intelligence Platform</h1>
          <p>Market & Competitor Dashboard</p>
        </div>
      </header>

      <main className="main">
        <div className="filter-bar">
          {tickers.map(ticker => (
            <button
              key={ticker}
              className={`filter-btn ${activeTicker === ticker ? 'active' : ''}`}
              onClick={() => setActiveTicker(ticker)}
            >
              {ticker}
            </button>
          ))}
        </div>

        <StockPrices activeTicker={activeTicker} />
        <NewsFeed activeTicker={activeTicker} />
      </main>
    </div>
  )
}

export default App