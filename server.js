// Optional local/standalone server (no Vercel needed).
// Serves the built app AND the /api/generate endpoint from one Node process.
//
//   1. npm run build
//   2. ANTHROPIC_API_KEY=sk-ant-... node server.js
//   3. open http://localhost:3000
//
// Requires Node 18+ (built-in fetch). No extra dependencies.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon",
  ".png": "image/png", ".woff2": "font/woff2",
};

async function handleGenerate(req, res) {
  if (!API_KEY) {
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Server missing ANTHROPIC_API_KEY" }));
  }
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", async () => {
    try {
      const { system, message, max_tokens } = JSON.parse(raw || "{}");
      if (!system || !message) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing system or message" }));
      }
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: Math.min(Math.max(parseInt(max_tokens) || 2000, 256), 8000),
          system,
          messages: [{ role: "user", content: message }],
        }),
      });
      if (!r.ok) {
        const detail = await r.text();
        res.writeHead(r.status, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Anthropic API error", detail }));
      }
      const data = await r.json();
      const text = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean).join("\n").trim();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ text }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Proxy failure", detail: String(e) }));
    }
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  let filePath = path.join(DIST, urlPath);
  if (!filePath.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(DIST, "index.html"), (e2, html) => {
        if (e2) { res.writeHead(404); return res.end("Not found"); }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

http.createServer((req, res) => {
  if (req.url.startsWith("/api/generate")) {
    if (req.method === "OPTIONS") { res.writeHead(200); return res.end(); }
    if (req.method === "POST") return handleGenerate(req, res);
    res.writeHead(405); return res.end();
  }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Mosaic Content Crew running at http://localhost:${PORT}`);
  if (!API_KEY) console.warn("WARNING: ANTHROPIC_API_KEY not set — generation will fail.");
});
