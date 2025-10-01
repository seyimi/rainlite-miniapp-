// app.js — valid, self-contained demo (no server required).
// Flow: generate/publish server hash → open case (deterministic using serverSeed + clientSeed + nonce) → reveal server seed for verification.

document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const userNameEl = document.getElementById('userName');
  const balanceEl = document.getElementById('balance');
  const publishBtn = document.getElementById('publishBtn');
  const openBtn = document.getElementById('openBtn');
  const caseThumb = document.getElementById('caseThumb');

  const serverHashEl = document.getElementById('serverHash');
  const clientSeedEl = document.getElementById('clientSeed');
  const outcomeHashEl = document.getElementById('outcomeHash');
  const revealBtn = document.getElementById('revealBtn');
  const serverSeedEl = document.getElementById('serverSeed');
  const nonceEl = document.getElementById('nonce');
  const revealArea = document.getElementById('revealArea');
  const logEl = document.getElementById('log');

  // State
  let balance = 1000;
  let clientSeed = generateSeed();
  let serverSeed = null;      // keep hidden until reveal
  let serverHash = null;      // published hash
  let nonce = 0;
  let lastOutcomeHex = '—';

  // initialize UI
  clientSeedEl.textContent = clientSeed;
  updateBalance();
  log('Ready.');

  // Try Telegram Web App (if inside Telegram)
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userNameEl.textContent = (tg.initDataUnsafe.user.first_name || 'User') + (tg.initDataUnsafe.user.last_name ? ' ' + tg.initDataUnsafe.user.last_name : '');
      } else {
        userNameEl.textContent = 'Telegram user';
      }
      tg.ready?.();
    }
  } catch (e) { /* ignore if not present */ }

  // Publish server hash (simulated server action)
  publishBtn.addEventListener('click', async () => {
    serverSeed = generateSeed();
    serverHash = await sha256(serverSeed);
    serverHashEl.textContent = serverHash;
    serverSeedEl.textContent = '—';
    revealArea.style.display = 'none';
    log('Server hash published. (server seed hidden)');
  });

  // Open case button
  openBtn.addEventListener('click', async () => {
    if (!serverHash) {
      alert('Please "Publish Server Hash" first (simulates server publishing a hash before rounds).');
      return;
    }
    if (balance < 100) { alert('Not enough balance'); return; }
    balance -= 100;
    updateBalance();

    // visual
    openBtn.disabled = true;
    caseThumb.textContent = '🔒';
    log('Opening case...');

    // compute deterministic outcome
    const outcomeHex = await sha256(`${serverSeed}:${clientSeed}:${nonce}`);
    lastOutcomeHex = outcomeHex;
    outcomeHashEl.textContent = outcomeHex;

    // convert to float 0..1 using first 8 hex chars
    const v = hexToFloat(outcomeHex);
    const result = determineRarity(v);

    // animate reveal
    setTimeout(() => {
      caseThumb.textContent = result.icon;
      openBtn.disabled = false;
      log(`Opened case — you got: ${result.label} (v=${(v).toFixed(5)})`);
      // increase nonce after each open (server would normally do this)
      nonce += 1;
      nonceEl.textContent = nonce;
    }, 800);
  });

  // Reveal server seed for verification (simulated server reveal)
  revealBtn.addEventListener('click', () => {
    if (!serverSeed) { alert('No server seed generated yet. Publish server hash first.'); return; }
    serverSeedEl.textContent = serverSeed;
    revealArea.style.display = 'block';
    log('Server seed revealed. You can independently compute sha256(serverSeed) and verify the published hash.');
  });

  // Copy buttons
  document.querySelectorAll('.copy').forEach(btn=>{
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-target');
      const el = document.getElementById(t);
      if (!el) return;
      copyToClipboard(el.textContent);
      log(`Copied ${t} to clipboard.`);
    });
  });

  // Utilities
  function updateBalance() {
    balanceEl.textContent = `${balance} ✨`;
  }

  function log(msg) {
    const now = new Date().toLocaleTimeString();
    logEl.textContent = `${now} — ${msg}\n` + logEl.textContent;
  }

  function generateSeed() {
    // 16 random bytes -> hex + timestamp
    const r = new Uint8Array(16);
    crypto.getRandomValues(r);
    return Array.from(r).map(b => b.toString(16).padStart(2,'0')).join('') + '-' + Date.now().toString(36);
  }

  async function sha256(msg) {
    const encoded = new TextEncoder().encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function hexToFloat(hex) {
    // take first 8 chars (32-bit) and convert to [0,1)
    const prefix = hex.slice(0,8);
    const intVal = parseInt(prefix, 16);
    const max = 0xffffffff;
    return intVal / max;
  }

  function determineRarity(vFloat) {
    // thresholds (cumulative):
    // Legendary: 0.2%   -> 0.002
    // Epic:      1.8%   -> up to 0.02
    // Rare:     18%     -> up to 0.20
    // Common:   remainder
    if (vFloat < 0.002) return { label: 'Legendary', icon: '💎' };
    if (vFloat < 0.02) return { label: 'Epic', icon: '✨' };
    if (vFloat < 0.20) return { label: 'Rare', icon: '🔹' };
    return { label: 'Common', icon: '🎫' };
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }
});
