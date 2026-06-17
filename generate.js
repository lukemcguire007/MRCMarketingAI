// Serverless function: /api/generate
// Holds your Anthropic API key server-side and forwards requests.
// Works on Vercel, Netlify (with minor export tweak), or any Node host.

export default async function handler(req, res) {
  // ---- CORS ----
  // Same-origin needs no CORS. If you call this from another domain, set
  // ALLOWED_ORIGIN in your env to that domain. Defaults to "*" for convenience.
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  try {
    // Vercel parses JSON automatically; guard for raw bodies just in case.
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { system, message, max_tokens } = body;

    if (!system || !message) {
      return res.status(400).json({ error: "Missing system or message" });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: Math.min(Math.max(parseInt(max_tokens) || 2000, 256), 8000),
        system,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      return res
        .status(anthropicRes.status)
        .json({ error: "Anthropic API error", detail });
    }

    const data = await anthropicRes.json();
    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!text) return res.status(502).json({ error: "Empty response from model" });

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Proxy failure", detail: String(e) });
  }
}
