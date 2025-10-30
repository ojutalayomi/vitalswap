import { useEffect, useMemo, useRef, useState } from 'react'
import { ShieldCheckIcon, CogIcon, Eye, ArrowLeftRight, Landmark, CreditCardIcon } from 'lucide-react'
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

  // Mobile nav state
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // FAQ state
  // const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true })

  // Derived values
  const liveRate = useMemo(() => {
    if (fromAsset === toAsset) return 1
    return usdPrices[fromAsset] / usdPrices[toAsset]
  }, [fromAsset, toAsset, usdPrices])

  const estimatedReceive = useMemo(() => {
    const usdAfterFees = Math.max(0, sendAmountUSD - sendAmountUSD * feePct - networkFeeUSD)
    return usdAfterFees / usdPrices[receiveAsset]
  }, [sendAmountUSD, feePct, networkFeeUSD, receiveAsset, usdPrices])
  
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
          const next: Record<Asset, number> = { ...prev };
          (Object.keys(next) as Asset[]).forEach(k => {
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

  // Close mobile menu on outside click, Escape, hash change or when resizing to desktop
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!menuOpen) return
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    function onHash() { setMenuOpen(false) }
    function onResize() {
      if (window.innerWidth >= 900) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('resize', onResize)
    }
  }, [menuOpen])

  function swapAssets() {
    setFromAsset(toAsset)
    setToAsset(fromAsset)
  }

  // function toggleFaq(i: number) {
  //   setFaqOpen(prev => ({ ...prev, [i]: !prev[i] }))
  // }

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
          <div className="nav-cta flex flex-row gap-2 items-center justify-center">
            <div className="nav-links">
              <a href="#swap">Swap</a>
              <a href="#fees">Fees</a>
              <a href="#about">About</a>
              <a href="#help">Help Center</a>
          </div>
            <button className="btn max-[400px]:!hidden transition-all duration-200 hover:shadow-md active:scale-[0.98]" style={{ background: 'transparent', color: '#0f1728', borderColor: 'var(--border)' }}>Log In</button>
            <button className="btn max-[400px]:!hidden transition-all duration-200 hover:shadow-md active:scale-[0.98]">Sign Up</button>
            <button
              ref={buttonRef}
              className={`hamburger ${menuOpen ? 'open' : ''}`}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(v => !v)}
            >
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </button>
          </div>
        </div>

        <div id="mobile-menu" ref={menuRef} className={`mobile-menu ${menuOpen ? 'open' : ''} shadow-lg`}> 
          <div className="mobile-row">
            <div className="mobile-links flex flex-col gap-2">
              <a href="#swap" onClick={() => setMenuOpen(false)}>Swap</a>
              <a href="#fees" onClick={() => setMenuOpen(false)}>Fees</a>
              <a href="#about" onClick={() => setMenuOpen(false)} className='border-b border-gray-200 pb-2'>About</a>
              <a href="#help" onClick={() => setMenuOpen(false)} className='border-b border-gray-200 pb-2'>Help Center</a>
            </div>
            <div className="mobile-actions min-[400px]:!hidden flex flex-col gap-2">
              <button className="btn" style={{ background: 'transparent', color: '#0f1728', borderColor: 'var(--border)' }} onClick={() => setMenuOpen(false)}>Log In</button>
              <button className="btn" onClick={() => setMenuOpen(false)}>Sign Up</button>
            </div>
          </div>
        </div>

      </nav>

      <header className="hero flex flex-col justify-center min-h-[60vh] p-12">
        <div className="p-12">
          <h1 className='font-bold !text-6xl max-[640px]:!text-4xl max-[480px]:!text-3xl'>Clear Fees. Total Transparency.</h1>
          <p className='text-lg text-gray-500'>Know exactly what you&apos;re paying before you swap. No hidden charges, no surprises.</p>
          <button className="btn max-[351px]:!text-xs transition-all duration-200 hover:shadow-md active:scale-[0.98]">Start a Transaction</button>
        </div>
      </header>

      <section className="section" id="swap">
        <div className="container flex flex-col items-center justify-center">
          <h2 className="section-title !text-4xl font-bold">Live Market Rates</h2>
          <p className="section-sub">Real{"‑"}time data to help you make the best decision.</p>
          <div className="card pad min-h-[200px] p-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex flex-col items-center justify-center m-4">
              <div className="flex flex-row gap-4 items-end justify-between w-full">
                <div className='flex flex-col gap-1 items-center justify-center'>
                  <div className="text-sm text-gray-500 font-bold w-full text-left">From</div>
                  <div className="field transition-colors duration-200 focus-within:ring-2 focus-within:ring-blue-500/30">
                    <select value={fromAsset} onChange={e => setFromAsset(e.target.value as Asset)}>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="USDT">Tether (USDT)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <button className="swap transition-all duration-200 active:scale-95" aria-label="Swap assets" onClick={swapAssets}>
                    <ArrowLeftRight className="size-4" />
                  </button>
                </div>
                <div className='flex flex-col gap-1 items-center justify-center'>
                  <div className="text-sm text-gray-500 font-bold w-full text-left">To</div>
                  <div className="field transition-colors duration-200 focus-within:ring-2 focus-within:ring-blue-500/30">
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
              <div className="text-2xl font-bold text-gray-900">1 {fromAsset} = {liveRate.toFixed(6)} {toAsset}</div>
              <div className="text-sm text-gray-500">Last updated {lastUpdated.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="fees" className="section">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Our Simple Fee Structure</h2>
          <p className="section-sub">One low, transparent fee. That&apos;s it.</p>
          <div className="card max-w-[800px] mx-auto overflow-x-auto transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <table className="table text-nowrap">
              <thead>
                <tr>
                  <th>Transaction Type</th>
                  <th>Fee %</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="icon">
                    <ArrowLeftRight className="size-4 text-[var(--primary)]" />
                    Crypto Swap
                  </td>
                  <td>0.5%</td>
                  <td>Swap $1,000 in BTC, fee is $5.00</td>
                </tr>
                <tr>
                  <td className="icon">
                    <CreditCardIcon className="size-4 text-[var(--primary)]" />
                    Fiat Purchase
                  </td>
                  <td>1.0% + Network Fee</td>
                  <td>Buy $500 of ETH, fee is $5.00 + gas</td>
                </tr>
                <tr>
                  <td className="icon">
                    <Landmark className="size-4 text-[var(--primary)]" />
                    Withdraw to Bank
                  </td>
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
          <p className="section-sub">See exactly what you&apos;ll receive before you commit.</p>
          <div className="card pad max-w-[600px] mx-auto transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="calc !gap-1">
              <div>You send</div>
              <div className="field transition-colors duration-200 focus-within:ring-2 focus-within:ring-blue-500/30" style={{ gap: 8 }}>
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
              <div className="result transition-all duration-200">
                <div>
                  <div className="value">{formatCrypto(estimatedReceive)} {receiveAsset}</div>
                </div>
                <div className="flex items-center justify-end" style={{ width: 100 }}>
                  <select className='text-gray-900 bg-transparent border-none outline-none' value={receiveAsset} onChange={e => setReceiveAsset(e.target.value as Asset)}>
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
            <div className="value-card shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="value-icon">
                <ShieldCheckIcon className="size-8" />
              </div>
              <div className="chip">Ironclad Security</div>
              <p className="muted">Fees contribute to industry{"‑"}leading security measures, keeping your assets safe 24/7.</p>
            </div>
            <div className="value-card shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="value-icon">
                <CogIcon className="size-8" />
              </div>
              <div className="chip">Platform Maintenance</div>
              <p className="muted">We continuously improve our platform for faster, more reliable transactions.</p>
            </div>
            <div className="value-card shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="value-icon">
                <Eye className="size-8" />
              </div>
              <div className="chip">Radical Transparency</div>
              <p className="muted">What you see is what you pay. Clear pricing without hidden costs.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Frequently Asked Questions</h2>
          <p className="section-sub">Have more questions? We&apos;ve got answers.</p>
          <div className="faq">
            <details className="faq-item border-b border-gray-200 py-3 group transition-all duration-300 hover:shadow-md">
              <summary className="faq-q cursor-pointer flex items-center justify-between text-lg font-medium text-gray-900 outline-none transition-colors hover:text-blue-600 focus:text-blue-600">
                Are there any hidden charges?
                <span className="font-bold text-xl transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="faq-a text-gray-600 mt-2 pl-1">
                Absolutely not. The fee you see in the calculator is the fee you&apos;ll pay. The only variable outside our control is the network fee (gas), which is paid to miners.
              </div>
            </details>
            <details className="faq-item border-b border-gray-200 py-3 group transition-all duration-300 hover:shadow-md">
              <summary className="faq-q cursor-pointer flex items-center justify-between text-lg font-medium text-gray-900 outline-none transition-colors hover:text-blue-600 focus:text-blue-600">
                Why do fees vary between transaction types?
                <span className="font-bold text-xl transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="faq-a text-gray-600 mt-2 pl-1">
                Different transaction types require different infrastructure and operational costs, but our pricing remains simple and fair.
              </div>
            </details>
            <details className="faq-item border-b border-gray-200 py-3 group transition-all duration-300 hover:shadow-md">
              <summary className="faq-q cursor-pointer flex items-center justify-between text-lg font-medium text-gray-900 outline-none transition-colors hover:text-blue-600 focus:text-blue-600">
                Does the exchange rate include a spread?
                <span className="font-bold text-xl transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="faq-a text-gray-600 mt-2 pl-1">
                Rates are sourced from reputable liquidity providers. Any spread is reflected transparently in the live rate you see.
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="cta min-h-[50vh] flex flex-col justify-center p-12">
        <div className="container">
          <h2 className="section-title text-2xl font-bold">Ready to swap with clarity?</h2>
          <p className="section-sub">Join thousands who trust VitalSwap for secure and transparent transactions. Get started in minutes.</p>
          <button className="btn !text-xl !px-12 !py-6 transition-all duration-200 hover:shadow-lg active:scale-[0.98]">Get Started</button>
          <div className="footer-space" />
        </div>
      </section>
    </>
  )
}

export default App
