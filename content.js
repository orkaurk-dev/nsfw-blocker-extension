async function getSettings() {
  return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderBlockedPage(url) {
  const safeUrl = escapeHtml(url);
  const safeHost = escapeHtml(new URL(url).hostname);

  document.open();
  document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Site blocked</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0f1115;
      --panel: #171b22;
      --panel-border: #2a3140;
      --text: #eef2f7;
      --muted: #a6b0c0;
      --accent: #f97316;
      --accent-strong: #ea580c;
      --danger: #fb7185;
    }
    html, body {
      min-height: 100%;
      margin: 0;
      background:
        radial-gradient(circle at top, rgba(249, 115, 22, 0.18), transparent 36%),
        linear-gradient(180deg, #0b0d12 0%, var(--bg) 100%);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      display: grid;
      place-items: center;
      padding: 32px;
      box-sizing: border-box;
    }
    .card {
      width: min(760px, 100%);
      background: rgba(23, 27, 34, 0.92);
      border: 1px solid var(--panel-border);
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
      padding: 32px;
      backdrop-filter: blur(10px);
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 12px;
      color: var(--accent);
      margin: 0 0 12px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(28px, 4vw, 44px);
      line-height: 1.05;
    }
    p {
      margin: 0 0 16px;
      color: var(--muted);
      line-height: 1.6;
      font-size: 15px;
    }
    .url-box {
      margin: 20px 0;
      padding: 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      word-break: break-all;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
      color: #d7dde7;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }
    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 120ms ease, background 120ms ease;
    }
    button:hover { transform: translateY(-1px); }
    .primary {
      background: linear-gradient(180deg, var(--accent), var(--accent-strong));
      color: white;
    }
    .secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--panel-border);
    }
    .note {
      margin-top: 18px;
      color: var(--danger);
      font-size: 13px;
    }
  </style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">Blocked by NSFW Website Blocker</p>
    <h1>This site is blocked.</h1>
    <p>The current page matches your block list or keyword rules.</p>
    <div class="url-box">
      <strong>Host:</strong> ${safeHost}<br />
      <strong>URL:</strong> ${safeUrl}
    </div>
    <div class="actions">
      <button class="primary" id="open-options">Open blocker settings</button>
      <button class="secondary" id="go-back">Go back</button>
    </div>
    <div class="note">If this is a false positive, remove the domain or keyword in the extension settings.</div>
  </main>
</body>
</html>`);
  document.close();

  setTimeout(() => {
    document.getElementById("open-options")?.addEventListener("click", () => chrome.runtime.openOptionsPage());
    document.getElementById("go-back")?.addEventListener("click", () => {
      if (history.length > 1) {
        history.back();
      } else {
        location.replace("about:blank");
      }
    });
  }, 0);
}

(async () => {
  const settings = await getSettings();
  if (!shouldBlockUrl(location.href, settings)) {
    return;
  }

  renderBlockedPage(location.href);
})();
