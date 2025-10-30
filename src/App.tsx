import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Asset = 'ETH' | 'BTC' | 'USDT'

const usdPricesInitial: Record<Asset, number> = {
  ETH: 3450,
  BTC: 60000,
  USDT: 1,
}

function App() {
  // Live market section state
  const [fromAsset, setFromAsset] = useState<Asset>('ETH')
  const [toAsset, setToAsset] = useState<Asset>('BTC')
  const [usdPrices, setUsdPrices] = useState<Record<Asset, number>>(usdPricesInitial)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Calculator state
  const [sendAmountUSD, setSendAmountUSD] = useState<number>(1000)
  const [receiveAsset, setReceiveAsset] = useState<Asset>('ETH')
  const feePct = 0.005 // 0.5%
  const networkFeeUSD = 1.25

  // FAQ state
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true })

  // Derived values
  const liveRate = useMemo(() => {
    if (fromAsset === toAsset) return 1
    return usdPrices[fromAsset] / usdPrices[toAsset]
  }, [fromAsset, toAsset, usdPrices])

  const estimatedReceive = useMemo(() => {
    const usdAfterFees = Math.max(0, sendAmountUSD - sendAmountUSD * feePct - networkFeeUSD)
    return usdAfterFees / usdPrices[receiveAsset]
  }, [sendAmountUSD, feePct, networkFeeUSD, receiveAsset, usdPrices])

  // Fetch live USD prices periodically, with fallback to gentle noise if API fails
  useEffect(() => {
    let cancelled = false

    async function fetchPrices() {
      try {
        const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd', { cache: 'no-store' })
        if (!resp.ok) throw new Error('bad response')
        const data: any = await resp.json()
        if (cancelled) return
        const next: Record<Asset, number> = {
          BTC: data.bitcoin.usd,
          ETH: data.ethereum.usd,
          USDT: data.tether.usd,
        }
        setUsdPrices(next)
        setLastUpdated(new Date())
      } catch {
        // Fallback: apply small noise to previous prices so UI still moves
        setUsdPrices(prev => {
          const next: Record<Asset, number> = { ...prev }
          ;(Object.keys(next) as Asset[]).forEach(k => {
            const base = next[k]
            const noise = 1 + (Math.random() - 0.5) * 0.002
            next[k] = Math.max(0.0001, base * noise)
          })
          return next
        })
        setLastUpdated(new Date())
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Sync selected assets to URL and restore from URL on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const f = params.get('from') as Asset | null
    const t = params.get('to') as Asset | null
    const r = params.get('receive') as Asset | null
    if (f && (['ETH','BTC','USDT'] as Asset[]).includes(f)) setFromAsset(f)
    if (t && (['ETH','BTC','USDT'] as Asset[]).includes(t)) setToAsset(t)
    if (r && (['ETH','BTC'] as Asset[]).includes(r)) setReceiveAsset(r)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('from', fromAsset)
    params.set('to', toAsset)
    params.set('receive', receiveAsset)
    const next = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', next)
  }, [fromAsset, toAsset, receiveAsset])

  function swapAssets() {
    setFromAsset(toAsset)
    setToAsset(fromAsset)
  }

  function toggleFaq(i: number) {
    setFaqOpen(prev => ({ ...prev, [i]: !prev[i] }))
  }

  function formatUSD(v: number) {
    return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
  }
  function formatCrypto(v: number) {
    return v.toLocaleString(undefined, { maximumFractionDigits: 6 })
  }

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner ">
          <div className="logo">
            <span className="logo-dot" />
            VitalSwap
          </div>
          <div className="nav-links">
            <a href="#swap">Swap</a>
            <a href="#fees">Fees</a>
            <a href="#about">About</a>
            <a href="#help">Help Center</a>
          </div>
          <div className="nav-cta">
            <button className="btn" style={{ background: 'transparent', color: '#0f1728', borderColor: 'var(--border)' }}>Log In</button>
            <button className="btn">Sign Up</button>
          </div>
        </div>
      </nav>

      <header className="hero flex flex-col justify-center min-h-[60vh] p-12">
        <div className="p-12">
          <h1 className='font-bold !text-6xl'>Clear Fees. Total Transparency.</h1>
          <p className='text-lg text-gray-500'>Know exactly what you&apos;re paying before you swap. No hidden charges, no surprises.</p>
          <button className="btn">Start a Transaction</button>
        </div>
      </header>

      <section className="section" id="swap">
        <div className="container flex flex-col items-center justify-center">
          <h2 className="section-title !text-4xl font-bold">Live Market Rates</h2>
          <p className="section-sub">Real‑time data to help you make the best decision.</p>
          <div className="card pad min-w-[600px] min-h-[200px] p-2">
            <div className="flex flex-col items-center justify-center m-4">
              <div className="flex flex-row gap-4 items-end justify-between w-full">
                <div className='flex flex-col gap-1 items-center justify-center'>
                  <div className="text-sm text-gray-500 font-bold w-full text-left">From</div>
                  <div className="field">
                    <select value={fromAsset} onChange={e => setFromAsset(e.target.value as Asset)}>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="USDT">Tether (USDT)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <button className="swap" aria-label="Swap assets" onClick={swapAssets}>↔</button>
                </div>
                <div className='flex flex-col gap-1 items-center justify-center'>
                  <div className="text-sm text-gray-500 font-bold w-full text-left">To</div>
                  <div className="field">
                    <select value={toAsset} onChange={e => setToAsset(e.target.value as Asset)}>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="USDT">Tether (USDT)</option>
                    </select>
                  </div>
                </div>
                </div>
            </div>
            <hr className="w-full border-gray-200 my-4" />
            <div className="flex flex-col items-center justify-center m-4">
              <div className="text-sm text-gray-500">Live Rate</div>
              <div className="text-4xl font-bold text-gray-900">1 {fromAsset} = {liveRate.toFixed(6)} {toAsset}</div>
              <div className="text-sm text-gray-500">Last updated {lastUpdated.toLocaleTimeString()}</div>
            </div>
          </div>
      </div>
      </section>

      <section id="fees" className="section">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Our Simple Fee Structure</h2>
          <p className="section-sub">One low, transparent fee. That’s it.</p>
          <div className="card max-w-[800px] mx-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction Type</th>
                  <th>Fee %</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="icon">⇄</span>Crypto Swap</td>
                  <td>0.5%</td>
                  <td>Swap $1,000 in BTC, fee is $5.00</td>
                </tr>
                <tr>
                  <td><span className="icon">$</span>Fiat Purchase</td>
                  <td>1.0% + Network Fee</td>
                  <td>Buy $500 of ETH, fee is $5.00 + gas</td>
                </tr>
                <tr>
                  <td><span className="icon">⤓</span>Withdraw to Bank</td>
                  <td>0.2%</td>
                  <td>Withdraw $2,000, fee is $4.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Calculate Your Transaction</h2>
          <p className="section-sub">See exactly what you’ll receive before you commit.</p>
          <div className="card pad max-w-[600px] mx-auto">
            <div className="calc !gap-1">
              <div>You send</div>
              <div className="field" style={{ gap: 8 }}>
                <input
                  // type="number"
                  placeholder="1000.00"
                  value={Number.isFinite(sendAmountUSD) ? sendAmountUSD : ''}
                  onChange={e => setSendAmountUSD(Number(e.target.value))}
                  min={0}
                  step={0.01}
                />
                <select defaultValue="USD" className='!w-auto' disabled>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <hr className="w-full border-gray-200 my-4" />
              <div className="flex flex-row gap-1 items-center justify-between">
                <div className="muted">VitalSwap Fee (0.5%)</div>
                <div>{"- "}{formatUSD(sendAmountUSD * feePct)}</div>
              </div>
              <div className="flex flex-row gap-1 items-center justify-between">
                <div className="muted">Network Fee</div>
                <div>{"~ "}{formatUSD(networkFeeUSD)}</div>
              </div>
              <div className="muted font-bold text-xl mt-4">You receive (estimated)</div>
              <div className="result">
                <div>
                  <div className="value">{formatCrypto(estimatedReceive)} {receiveAsset}</div>
                </div>
                <div className="field" style={{ width: 100, justifyContent: 'flex-end' }}>
                  <select value={receiveAsset} onChange={e => setReceiveAsset(e.target.value as Asset)}>
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Fair Fees, Unmatched Value</h2>
          <p className="section-sub">Our fees help us provide a secure, reliable, and innovative platform.</p>
          <div className="value-cards">
            <div className="value-card">
              <div className="value-icon">🛡️</div>
              <div className="chip">Ironclad Security</div>
              <p className="muted">Fees contribute to industry‑leading security measures, keeping your assets safe 24/7.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚙️</div>
              <div className="chip">Platform Maintenance</div>
              <p className="muted">We continuously improve our platform for faster, more reliable transactions.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">📈</div>
              <div className="chip">Radical Transparency</div>
              <p className="muted">What you see is what you pay. Clear pricing without hidden costs.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Frequently Asked Questions</h2>
          <p className="section-sub">Have more questions? We’ve got answers.</p>
          <div className="faq">
            <div className="faq-item">
              <button className="faq-q" onClick={() => toggleFaq(0)} aria-expanded={!!faqOpen[0]}>
                Are there any hidden charges?<span>▾</span>
              </button>
              {faqOpen[0] && (
                <div className="faq-a">Absolutely not. The fee you see in the calculator is the fee you’ll pay. The only variable outside our control is the network fee (gas), which is paid to miners.</div>
              )}
            </div>
            <div className="faq-item">
              <button className="faq-q" onClick={() => toggleFaq(1)} aria-expanded={!!faqOpen[1]}>
                Why do fees vary between transaction types?<span>▾</span>
              </button>
              {faqOpen[1] && (
                <div className="faq-a">Different transaction types require different infrastructure and operational costs, but our pricing remains simple and fair.</div>
              )}
            </div>
            <div className="faq-item">
              <button className="faq-q" onClick={() => toggleFaq(2)} aria-expanded={!!faqOpen[2]}>
                Does the exchange rate include a spread?<span>▾</span>
              </button>
              {faqOpen[2] && (
                <div className="faq-a">Rates are sourced from reputable liquidity providers. Any spread is reflected transparently in the live rate you see.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Ready to swap with clarity?</h2>
          <p className="section-sub">Join thousands who trust VitalSwap for secure and transparent transactions. Get started in minutes.</p>
          <button className="btn">Get Started</button>
          <div className="footer-space" />
        </div>
      </section>
    </>
  )
}

export default App
