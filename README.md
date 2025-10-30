# VitalSwap: Transparent Crypto Swaps with React, TypeScript & Vite

Welcome to VitalSwap – a fully transparent crypto swap calculator app built with React, TypeScript, and Vite.

## Features

- **Live Prices**: Real-time crypto rates (ETH, BTC, USDT) via CoinGecko
- **Transparent Fees**: Always see exactly what you’ll pay (no hidden charges)
- **Intuitive UI**: Simple swaps, clean interfaces, mobile responsive
- **Calculator**: Breakdown of receive amounts, network and platform fees
- **Auto Sync**: Asset selections persist in URL for bookmarking/sharing
- **FAQ & Full Demo**: Help and info included for clarity

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for fast HMR-powered development
- [Tailwind CSS](https://tailwindcss.com/) for UI utility styling
- ESLint included (see below)

## Getting Started

```bash
git clone https://github.com/YOURNAME/vitalswap.git
cd vitalswap
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Project Structure

- `src/App.tsx`: Main application logic & UI.
- `src/index.css`: Global, Tailwind & custom CSS.
- `public/`: Static files.
- `README.md`: This file.

## Live Market Calculation

- Swaps are calculated using the latest USD price for each crypto.
- Fees and network costs are itemized before your transaction.

## Fee Structure

| Transaction Type   | Fee                 | Example                        |
|--------------------|---------------------|--------------------------------|
| Crypto Swap        | 0.5%                | Swap $1,000 BTC: $5 fee        |
| Fiat Purchase      | 1.0% + Network Fee  | Buy $500 ETH: $5 + gas         |
| Withdraw to Bank   | 0.2%                | Withdraw $2,000: $4 fee        |

_Fees fund platform security, software quality, and fair operation._

## Calculate Your Transaction

Try out the in-app calculator:
- Enter send amount in USD
- Choose receive asset
- Instantly see fee breakdown _before_ you swap

## Demo

![VitalSwap Screenshot](./screenshot.png)

## FAQ

**Q:** Are there hidden charges?  
**A:** Never. All fees and network costs are presented before you swap.

**Q:** Why do fees vary?  
**A:** Different operations require different infrastructure and settlement.

**Q:** Is the exchange rate real?  
**A:** Yes – sourced live from reputable liquidity providers.

## ESLint & TypeScript

TypeScript and ESLint are configured for best practices and code quality.
You can expand your lint setup for production by enabling type-aware rules:

```js
// eslint.config.js (example)
import tseslint from '@typescript-eslint/eslint-plugin'
export default [
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // or tseslint.configs.strictTypeChecked for stricter
      // Optional: tseslint.configs.stylisticTypeChecked for stylistic rules
    ],
    languageOptions: {
      parserOptions: { project: ['./tsconfig.json'], tsconfigRootDir: import.meta.dirname },
    },
  },
]
```

## License

[MIT](./LICENSE)

---

Made with ❤️ by [YOURNAME] – Fork or contribute!
