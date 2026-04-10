import { useState, useEffect, useRef } from "react";

const DEFAULT_CONFIG = {
  appName: "My App",
  iosUrl: "https://apps.apple.com/app/your-app/id123456789",
  androidUrl: "https://play.google.com/store/apps/details?id=com.yourapp",
  fallbackUrl: "https://yourwebsite.com",
};

function generateRedirectHTML(config) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.appName} — Download</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 48px 40px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 28px; font-weight: 700; color: #111; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 15px; margin-bottom: 32px; line-height: 1.5; }
    .spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #f0f0f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .redirect-msg { color: #888; font-size: 14px; }
    .options { display: none; flex-direction: column; gap: 12px; }
    .btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 15px 20px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      color: white;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    .btn-ios  { background: linear-gradient(135deg, #007AFF, #0055FF); }
    .btn-android { background: linear-gradient(135deg, #34A853, #1a8a3a); }
    .btn-web  { background: linear-gradient(135deg, #8B5CF6, #6D28D9); }
    .divider  { border: none; border-top: 1px solid #f0f0f0; margin: 8px 0; }
  </style>
  <script>
    window.addEventListener("DOMContentLoaded", function () {
      var ua = navigator.userAgent || navigator.vendor || window.opera;

      // iOS detection
      if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        window.location.replace("${config.iosUrl}");
        return;
      }

      // Android detection
      if (/android/i.test(ua)) {
        window.location.replace("${config.androidUrl}");
        return;
      }

      // Desktop / unknown — show all options
      document.getElementById("spinner-wrap").style.display = "none";
      document.getElementById("options").style.display = "flex";
    });
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">📱</div>
    <h1>${config.appName}</h1>
    <p class="subtitle">You're being redirected to the right store for your device.</p>

    <div id="spinner-wrap" class="spinner-wrap">
      <div class="spinner"></div>
      <p class="redirect-msg">Detecting your device…</p>
    </div>

    <div id="options" class="options">
      <a href="${config.iosUrl}" class="btn btn-ios">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Download on the App Store
      </a>
      <a href="${config.androidUrl}" class="btn btn-android">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.523 15.341l-.008.008-2.938-2.939.005-.005-5.2-5.2-.006.006L6.44 4.275a10.13 10.13 0 0 1 2.546-1.173L9.71 4.84a.5.5 0 0 0 .58 0l1.71-1.71a10.07 10.07 0 0 1 5.524 12.21zM5.21 5.445l2.876 2.875-.006.006 5.2 5.2.006-.006 2.938 2.938a10.13 10.13 0 0 1-14.126-5.41A10.07 10.07 0 0 1 5.21 5.445z"/></svg>
        Get it on Google Play
      </a>
      <hr class="divider" />
      <a href="${config.fallbackUrl}" class="btn btn-web">
        🌐 Visit Website
      </a>
    </div>
  </div>
</body>
</html>`;
}

// ─── QR Code renderer using canvas ────────────────────────────────────────────
// Tiny QR encoder (data URL via external img)
function QRCode({ url, size = 180 }) {
  const encoded = encodeURIComponent(url);
  // Use a public QR API for rendering
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=10`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      style={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
      onError={(e) => {
        e.target.style.display = "none";
        e.target.nextSibling.style.display = "flex";
      }}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SmartLinkGenerator() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("preview"); // preview | code
  const [hostedUrl, setHostedUrl] = useState("https://yourdomain.com/download");

  const html = generateRedirectHTML(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(html).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "redirect.html";
    a.click();
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    color: "#111",
    background: "#fafafa",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    fontSize: 12,
    color: "#374151",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "#f1f5f9",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>
          🔗 Smart Link Generator
        </h1>
        <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>
          One link that redirects iOS → App Store, Android → Play Store, Desktop → Website
        </p>
      </div>

      {/* How it works strip */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { emoji: "🔗", title: "Single URL", desc: "One link for everyone" },
          { emoji: "🔍", title: "User-Agent Detection", desc: "Reads the browser OS silently" },
          { emoji: "↪️", title: "Instant Redirect", desc: "Sends each user to the right store" },
          { emoji: "📷", title: "QR Compatible", desc: "Encodes the same URL — just works" },
          { emoji: "🏠", title: "Self-Hosted", desc: "Put on GitHub Pages, Netlify, etc." },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              background: "white",
              borderRadius: 10,
              padding: "14px 18px",
              textAlign: "center",
              flex: "1 1 140px",
              border: "1px solid #e5e7eb",
              minWidth: 130,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 2 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* LEFT: Config */}
        <div
          style={{
            flex: "1 1 280px",
            background: "white",
            borderRadius: 14,
            padding: 24,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>
            ⚙️ Configure
          </h2>

          {[
            { key: "appName", label: "App Name", placeholder: "My Awesome App", type: "text" },
            {
              key: "iosUrl",
              label: "iOS App Store URL",
              placeholder: "https://apps.apple.com/app/…",
              type: "url",
            },
            {
              key: "androidUrl",
              label: "Android Play Store URL",
              placeholder: "https://play.google.com/store/apps/details?id=…",
              type: "url",
            },
            {
              key: "fallbackUrl",
              label: "Fallback URL (Desktop)",
              placeholder: "https://yourwebsite.com",
              type: "url",
            },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{field.label}</label>
              <input
                type={field.type}
                value={config[field.key]}
                onChange={(e) =>
                  setConfig({ ...config, [field.key]: e.target.value })
                }
                placeholder={field.placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          {/* Redirect flow preview */}
          <div
            style={{
              marginTop: 8,
              background: "#f8fafc",
              borderRadius: 10,
              padding: 16,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Redirect flow
            </div>
            {[
              { label: "📱 iOS", color: "#007AFF", url: config.iosUrl },
              { label: "🤖 Android", color: "#34A853", url: config.androidUrl },
              { label: "💻 Desktop", color: "#8B5CF6", url: config.fallbackUrl },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                  padding: "8px 10px",
                  borderRadius: 7,
                  background: "white",
                  borderLeft: `3px solid ${row.color}`,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  → {row.url || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Output */}
        <div style={{ flex: "2 1 380px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* QR Code section */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
              📷 QR Code
            </h2>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <QRCode url={hostedUrl} size={160} />
                <div
                  style={{
                    display: "none",
                    width: 160,
                    height: 160,
                    borderRadius: 8,
                    border: "2px dashed #e5e7eb",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    fontSize: 12,
                    textAlign: "center",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 28 }}>📷</span>
                  QR preview requires<br />internet connection
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 13, color: "#374151", marginBottom: 12, lineHeight: 1.6 }}>
                  The QR code encodes your hosted URL. Anyone who scans it hits the same redirect page — no special QR app needed.
                </p>
                <label style={labelStyle}>Your hosted URL (for QR)</label>
                <input
                  type="url"
                  value={hostedUrl}
                  onChange={(e) => setHostedUrl(e.target.value)}
                  placeholder="https://yourdomain.com/download"
                  style={{ ...inputStyle, marginBottom: 10 }}
                />
                <div
                  style={{
                    background: "#fffbeb",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "#92400e",
                    lineHeight: 1.6,
                    border: "1px solid #fde68a",
                  }}
                >
                  <strong>💡 Deploy steps:</strong><br />
                  1. Download the HTML file below<br />
                  2. Host it (GitHub Pages / Netlify / Vercel)<br />
                  3. Paste your live URL here → QR updates<br />
                  4. Print or share the QR code!
                </div>
              </div>
            </div>
          </div>

          {/* HTML Output */}
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                📄 Generated redirect.html
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: "8px 14px",
                    background: copied ? "#22c55e" : "#f3f4f6",
                    color: copied ? "white" : "#374151",
                    border: "1px solid #e5e7eb",
                    borderRadius: 7,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    transition: "all 0.15s",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: "8px 14px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: 7,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  ⬇ Download
                </button>
              </div>
            </div>
            <pre
              style={{
                background: "#1e1e2e",
                color: "#cdd6f4",
                padding: 16,
                borderRadius: 8,
                overflow: "auto",
                fontSize: 11.5,
                maxHeight: 260,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {html}
            </pre>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 12,
          color: "#9ca3af",
          lineHeight: 1.6,
        }}
      >
        Detection uses <code>navigator.userAgent</code> — works in all modern browsers with no dependencies or tracking.
        <br />
        For advanced deep-linking (open specific in-app screens), add a <code>?deep_link=…</code> param and handle it inside your app.
      </div>
    </div>
  );
}
