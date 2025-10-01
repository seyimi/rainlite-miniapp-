RainLite — Telegram Mini App demo starter
=======================================

Files:
- index.html      : Single-page demo UI (Telegram Web App compatible)
- styles.css      : Styles (neon glass theme)
- app.js          : App logic (demo RNG, provably-fair demo)

How to preview locally:
1. Unzip the package.
2. Open index.html directly in your browser for a basic preview.
   - For Telegram Web App features (window.TelegramWebApp) you must host over HTTPS and set the URL in BotFather.
3. To host quickly:
   - Use Vercel, Netlify, or any static-file host.
   - Or run a simple local static server (e.g., `npx http-server ./`).

Notes:
- This is a demo starter. For production you need a backend for authoritative RNG, user accounts, WebSocket rooms, and secure seed handling.
- I can also generate a full Node.js server + Socket.IO and provide a zip for that if you want.
