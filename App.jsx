import React, { useState, useRef, useEffect } from "react";
import {
  PenLine, Share2, MapPin, Mail, Megaphone, DoorOpen,
  Copy, Check, RotateCw, Send, Settings2, ClipboardList, Loader2, X
} from "lucide-react";

/* ----------------------------- config ----------------------------- */
// Where the frontend sends generation requests. Defaults to a same-origin
// serverless function (works on Vercel when api/generate.js is deployed alongside).
//
// To override at build time, define VITE_API_URL and uncomment the Vite line in
// vite.config.js (it injects window.__API_URL__). We deliberately avoid bare
// `import.meta` here because it fails to parse in some preview runtimes.
const API_URL =
  (typeof window !== "undefined" && window.__API_URL__) || "/api/generate";

/* ----------------------------- brand tokens ----------------------------- */
const C = {
  forestDeep: "#13332A",
  forest: "#1C4A3A",
  forestMid: "#256048",
  gold: "#C8A23C",
  goldBright: "#E2C162",
  paper: "#F6F2E8",
  paperEdge: "#ECE5D3",
  ink: "#1A211D",
  muted: "#6E7C72",
  line: "#D8CFB9",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
@keyframes ticketIn { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
@keyframes pulseDot { 0%,100%{opacity:.3} 50%{opacity:1} }
@keyframes spin{to{transform:rotate(360deg)}}
* { box-sizing: border-box }
::-webkit-scrollbar { height:8px; width:8px }
::-webkit-scrollbar-thumb { background:#256048; border-radius:8px }
`;
const display = "'Oswald','Arial Narrow',sans-serif";
const body = "'Inter',system-ui,-apple-system,sans-serif";

/* ----------------------------- shared context ----------------------------- */
const BRAND_BASE = (extra) => `You are part of the in-house content crew for Mosaic Roofing Company LLC, a storm-restoration and full-service roofing contractor based in Dallas–Fort Worth, Texas. You write AS Mosaic. Never mention being an AI or a language model.

Company facts (pull in only what's relevant — never dump all of them):
- Services: residential & commercial roofing, hail/wind/storm damage restoration, insurance claim help, TPO and commercial flat-roof systems, repairs, replacements, free inspections.
- Service area: the Dallas–Fort Worth metroplex and surrounding North Texas.
- Phone: 214-548-9620 · Email: Luke@yourmosaicroof.com · Web: yourmosaicroof.com
- Address: 2525 Elm St, Suite 2613, Dallas, TX 75226

Brand voice: confident, straight-talking, and genuinely helpful — a trusted local contractor, not a national chain and not a pushy closer. Fluent in insurance and storm-claim language. Honest, do-right-by-people integrity WITHOUT being preachy or religious. Neighborly but professional.

Hard rules:
- No fake urgency, no unverifiable superlatives ("#1 in Texas"), no spammy hype, no emoji spam (a tasteful emoji is fine where the channel calls for it).
- Sound local to North Texas. Reference DFW hail/wind season only when it fits naturally.
- Be specific and useful over clever. Write copy a real roofer would proudly put their name on.${extra && extra.trim() ? `\n\nExtra direction from Luke (follow this): ${extra.trim()}` : ""}`;

/* ----------------------------- the crew ----------------------------- */
const CREW = [
  {
    id: "blog",
    name: "Blog & SEO Writer",
    role: "Long-form / search",
    Icon: PenLine,
    persona: `Your specialty: SEO blog content that ranks locally and reads like a knowledgeable contractor wrote it.
Output format (markdown):
**SEO Title:** (under 60 chars, includes the keyword naturally)
**Meta description:** (under 155 chars)
Then the article with a short hook intro, scannable ## H2 sections, and a closing call to action to call Mosaic at 214-548-9620 for a free inspection. Weave the primary keyword in naturally — never stuff it.`,
    fields: [
      { id: "topic", label: "Topic / working title", type: "text", placeholder: "e.g. What to do after a hailstorm hits your roof" },
      { id: "keyword", label: "Primary keyword", type: "text", placeholder: "e.g. hail damage roof repair Dallas" },
      { id: "audience", label: "Audience", type: "select", options: ["Homeowner", "Commercial property owner", "Storm-affected homeowner"] },
      { id: "length", label: "Length", type: "select", options: ["Quick (~300 words)", "Standard (~550 words)", "In-depth (outline + strong intro)"] },
      { id: "notes", label: "Anything else?", type: "textarea", placeholder: "Angle, points to hit, things to avoid…" },
    ],
    tokensFor: (v) => (v.length?.startsWith("In-depth") ? 4000 : v.length?.startsWith("Quick") ? 1200 : 2400),
    build: (v) => `Write a roofing blog post.
Topic: ${v.topic || "(roofing topic of your choice, relevant to DFW)"}
Primary keyword: ${v.keyword || "(choose a sensible local keyword)"}
Audience: ${v.audience || "Homeowner"}
Length: ${v.length || "Standard (~550 words)"}
${v.notes ? `Notes: ${v.notes}` : ""}`,
  },
  {
    id: "social",
    name: "Social Media Manager",
    role: "FB · IG · LinkedIn",
    Icon: Share2,
    persona: `Your specialty: platform-native social posts. Match the platform — Facebook is conversational and local, Instagram is visual with a few more hashtags, LinkedIn is professional and leans commercial/B2B.
For EACH post output:
- The caption
- "Hashtags:" 5–10 relevant, mostly local (DFW, city names)
- "Image idea:" one line describing the visual`,
    fields: [
      { id: "platform", label: "Platform", type: "select", options: ["Facebook", "Instagram", "LinkedIn"] },
      { id: "topic", label: "Topic / occasion", type: "text", placeholder: "e.g. Just finished a full reroof in Frisco" },
      { id: "count", label: "How many posts", type: "select", options: ["1 post", "3 posts", "5 posts"] },
      { id: "cta", label: "Call to action", type: "text", placeholder: "e.g. DM us for a free inspection" },
      { id: "notes", label: "Anything else?", type: "textarea", placeholder: "Tone, details, promo…" },
    ],
    tokensFor: (v) => (v.count?.startsWith("5") ? 3000 : v.count?.startsWith("3") ? 2000 : 900),
    build: (v) => `Write social media content.
Platform: ${v.platform || "Facebook"}
Topic/occasion: ${v.topic || "(general roofing value post for a DFW audience)"}
Number of posts: ${v.count || "1 post"}
CTA: ${v.cta || "(pick a natural one)"}
${v.notes ? `Notes: ${v.notes}` : ""}`,
  },
  {
    id: "gbp",
    name: "Google Business Profile",
    role: "Local map pack",
    Icon: MapPin,
    persona: `Your specialty: Google Business Profile posts that support local map-pack ranking.
Keep it under ~1500 characters (aim 120–300 words), naturally include a city + service phrase for local relevance, and end with a clear next step matching the chosen CTA button. If it's an Offer, add the offer plus a short terms line.`,
    fields: [
      { id: "ptype", label: "Post type", type: "select", options: ["Update", "Offer", "Event"] },
      { id: "topic", label: "Topic", type: "text", placeholder: "e.g. Free post-storm roof inspections this week" },
      { id: "offer", label: "Offer details", type: "text", placeholder: "e.g. $500 off full replacement", showIf: (v) => v.ptype === "Offer" },
      { id: "cta", label: "CTA button", type: "select", options: ["Call now", "Learn more", "Book", "Get offer", "Sign up"] },
      { id: "notes", label: "Anything else?", type: "textarea", placeholder: "City to emphasize, details…" },
    ],
    tokensFor: () => 1000,
    build: (v) => `Write a Google Business Profile post.
Type: ${v.ptype || "Update"}
Topic: ${v.topic || "(useful local roofing update)"}
${v.offer ? `Offer: ${v.offer}` : ""}
CTA button: ${v.cta || "Call now"}
${v.notes ? `Notes: ${v.notes}` : ""}`,
  },
  {
    id: "email",
    name: "Email & Nurture Writer",
    role: "Sequences & blasts",
    Icon: Mail,
    persona: `Your specialty: roofing email copy that gets opened and replied to.
Output: give 2–3 subject line options, a one-line preview text, then the body with a single clear CTA and a sign-off from Luke at Mosaic Roofing (214-548-9620). For a sequence, label Email 1 / 2 / 3 and suggest send timing (e.g. "Day 0", "Day 3").`,
    fields: [
      { id: "etype", label: "Format", type: "select", options: ["Single email", "3-step sequence"] },
      { id: "audience", label: "Audience", type: "select", options: ["New storm lead", "Quoted, not closed", "Past customer", "Commercial property manager"] },
      { id: "goal", label: "Goal", type: "text", placeholder: "e.g. book the free inspection" },
      { id: "notes", label: "Anything else?", type: "textarea", placeholder: "Offer, context, tone…" },
    ],
    tokensFor: (v) => (v.etype?.startsWith("3-step") ? 3000 : 1400),
    build: (v) => `Write roofing email copy.
Format: ${v.etype || "Single email"}
Audience: ${v.audience || "New storm lead"}
Goal: ${v.goal || "book a free inspection"}
${v.notes ? `Notes: ${v.notes}` : ""}`,
  },
  {
    id: "ads",
    name: "Ad & Landing Copywriter",
    role: "Paid & conversion",
    Icon: Megaphone,
    persona: `Your specialty: high-converting paid copy. Respect each channel's character limits and label them.
- Google Search: 5 headlines (≤30 chars each) + 3 descriptions (≤90 chars).
- Facebook: primary text, headline, description, and a CTA label.
- LSA (Local Services): short, trust-forward value props.
- Landing page: hero headline, subhead, 3 benefit bullets, and a CTA.`,
    fields: [
      { id: "channel", label: "Channel", type: "select", options: ["Google Search", "Facebook", "Local Services Ads", "Landing page"] },
      { id: "angle", label: "Offer / angle", type: "text", placeholder: "e.g. Free hail inspection, no out-of-pocket on approved claims" },
      { id: "audience", label: "Audience", type: "select", options: ["Storm-affected homeowner", "Homeowner (general)", "Commercial / TPO"] },
      { id: "notes", label: "Anything else?", type: "textarea", placeholder: "Proof points, city focus, tone…" },
    ],
    tokensFor: () => 1600,
    build: (v) => `Write ad / landing copy.
Channel: ${v.channel || "Google Search"}
Offer/angle: ${v.angle || "(free roof inspection)"}
Audience: ${v.audience || "Storm-affected homeowner"}
${v.notes ? `Notes: ${v.notes}` : ""}`,
  },
  {
    id: "canvass",
    name: "Canvassing Scriptwriter",
    role: "Door-to-door",
    Icon: DoorOpen,
    persona: `Your specialty: natural, respectful door-knocking scripts that a real rep can memorize.
Keep it short and human — no scammy pressure. Use [bracketed branches] for likely responses, include one solid objection rebuttal, and end with a clear ask (a free, no-obligation inspection). Write it as spoken lines, not paragraphs.`,
    fields: [
      { id: "scenario", label: "Scenario", type: "select", options: ["Storm door-knock", "Follow-up knock", "Objection handling", "Referral ask"] },
      { id: "context", label: "Neighborhood context", type: "text", placeholder: "e.g. recent hail, working a few roofs on this street" },
      { id: "objection", label: "Objection to handle", type: "text", placeholder: "e.g. 'I already filed with my insurance'", showIf: (v) => v.scenario === "Objection handling" },
      { id: "notes", label: "Anything else?", type: "textarea", placeholder: "Rep style, what to avoid…" },
    ],
    tokensFor: () => 1400,
    build: (v) => `Write a door-to-door canvassing script.
Scenario: ${v.scenario || "Storm door-knock"}
Neighborhood context: ${v.context || "(recent storm in the area)"}
${v.objection ? `Objection to handle: ${v.objection}` : ""}
${v.notes ? `Notes: ${v.notes}` : ""}`,
  },
];

/* ----------------------------- tiny markdown renderer ----------------------------- */
function inline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={key + "-" + i} style={{ color: C.forestDeep }}>{p.slice(2, -2)}</strong>;
    }
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return <a key={key + "-" + i} href={link[2]} target="_blank" rel="noreferrer" style={{ color: C.forestMid, textDecoration: "underline" }}>{link[1]}</a>;
    }
    return <span key={key + "-" + i}>{p}</span>;
  });
}
function Markdown({ text }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out = [];
  let list = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.type === "ol" ? "ol" : "ul";
    out.push(
      <Tag key={"l" + out.length} style={{ margin: "6px 0 12px", paddingLeft: 20, lineHeight: 1.6 }}>
        {list.items.map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{inline(it, "li" + out.length + i)}</li>)}
      </Tag>
    );
    list = null;
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); return; }
    let m;
    if ((m = line.match(/^#{1,3}\s+(.*)/))) {
      flush();
      const level = line.match(/^#+/)[0].length;
      out.push(
        <div key={"h" + idx} style={{
          fontFamily: display, fontWeight: 600, color: C.forestDeep,
          fontSize: level === 1 ? 20 : level === 2 ? 16 : 14,
          textTransform: level <= 2 ? "uppercase" : "none",
          letterSpacing: level <= 2 ? ".04em" : 0,
          margin: "16px 0 6px",
        }}>{inline(m[1], "h" + idx)}</div>
      );
      return;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)/))) {
      if (!list || list.type !== "ul") { flush(); list = { type: "ul", items: [] }; }
      list.items.push(m[1]); return;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)/))) {
      if (!list || list.type !== "ol") { flush(); list = { type: "ol", items: [] }; }
      list.items.push(m[1]); return;
    }
    flush();
    out.push(<p key={"p" + idx} style={{ margin: "0 0 10px", lineHeight: 1.65 }}>{inline(line, "p" + idx)}</p>);
  });
  flush();
  return <div>{out}</div>;
}

/* ----------------------------- field control ----------------------------- */
function Field({ f, value, onChange }) {
  const base = {
    width: "100%", fontFamily: body, fontSize: 14, color: C.ink,
    background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8,
    padding: "10px 12px", outline: "none",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.forestDeep, marginBottom: 6, fontFamily: body }}>
        {f.label}
      </label>
      {f.type === "textarea" ? (
        <textarea rows={3} value={value || ""} placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)} style={{ ...base, resize: "vertical" }} />
      ) : f.type === "select" ? (
        <select value={value || f.options[0]} onChange={(e) => onChange(e.target.value)}
          style={{ ...base, appearance: "none", cursor: "pointer" }}>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={value || ""} placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)} style={base} />
      )}
    </div>
  );
}

/* ----------------------------- main app ----------------------------- */
export default function App() {
  const [activeId, setActiveId] = useState("blog");
  const [vals, setVals] = useState({});
  const [extra, setExtra] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [ticketNo, setTicketNo] = useState(427);
  const ticketRef = useRef(null);

  const active = CREW.find((c) => c.id === activeId);
  const av = vals[activeId] || {};
  const setField = (fid, value) =>
    setVals((s) => ({ ...s, [activeId]: { ...(s[activeId] || {}), [fid]: value } }));

  // Esc closes settings
  useEffect(() => {
    if (!showSettings) return;
    const onKey = (e) => { if (e.key === "Escape") setShowSettings(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSettings]);

  const dispatch = async () => {
    setLoading(true); setError(null); setOutput(null); setCopied(false);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: BRAND_BASE(extra) + "\n\n" + active.persona,
          message: active.build(av),
          max_tokens: active.tokensFor ? active.tokensFor(av) : 2000,
        }),
      });
      if (!res.ok) {
        let msg = "Request failed (" + res.status + ")";
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const text = (data.text || "").trim();
      if (!text) throw new Error("Empty response");
      setTicketNo((n) => n + 1);
      setOutput({ text, crew: active.name, stamp: new Date(), no: ticketNo + 1 });
      setTimeout(() => ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } catch (e) {
      setError("The crew couldn't finish that one. " + (e.message || "Check your brief and try again."));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output.text);
      } else {
        // Fallback for non-secure contexts / older browsers
        const ta = document.createElement("textarea");
        ta.value = output.text;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy to clipboard — select the text manually.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: body, color: C.ink }}>
      <style>{FONTS}</style>

      {/* header */}
      <header style={{ background: C.forestDeep, borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ClipboardList size={20} color={C.forestDeep} />
            </div>
            <div>
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: ".06em", textTransform: "uppercase", lineHeight: 1 }}>
                Mosaic <span style={{ color: C.goldBright }}>Content Crew</span>
              </div>
              <div style={{ fontSize: 11.5, color: "#A9BCB0", marginTop: 3, letterSpacing: ".02em" }}>
                Your AI marketing team · Dallas–Fort Worth roofing
              </div>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} aria-label="Open crew briefing settings"
            style={{ display: "flex", alignItems: "center", gap: 7, background: "transparent", color: "#CDBE8E", border: `1px solid ${C.forestMid}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: body, fontSize: 13 }}>
            <Settings2 size={15} /> Crew briefing
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }} className="crew-layout">

          {/* roster */}
          <aside style={{ flexShrink: 0 }} className="crew-aside">
            <div style={{ fontFamily: display, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: C.muted, marginBottom: 10, paddingLeft: 2 }}>
              The crew
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="crew-roster">
              {CREW.map((c) => {
                const on = c.id === activeId;
                return (
                  <button key={c.id} onClick={() => { setActiveId(c.id); setError(null); }}
                    aria-pressed={on} aria-label={"Select " + c.name}
                    style={{
                      display: "flex", alignItems: "center", gap: 11, textAlign: "left",
                      minWidth: 200, flexShrink: 0, cursor: "pointer",
                      background: on ? C.forestDeep : "#fff",
                      border: `1px solid ${on ? C.forestDeep : C.line}`,
                      borderLeft: on ? `4px solid ${C.gold}` : `4px solid ${C.line}`,
                      borderRadius: 10, padding: "11px 13px", transition: "all .15s",
                    }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: on ? C.gold : C.paperEdge }}>
                      <c.Icon size={17} color={on ? C.forestDeep : C.forestMid} />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontFamily: display, fontWeight: 600, fontSize: 14.5, color: on ? "#fff" : C.forestDeep, lineHeight: 1.1, whiteSpace: "nowrap" }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: on ? "#A9BCB0" : C.muted, marginTop: 2 }}>{c.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* brief */}
          <section style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, background: C.paperEdge, display: "flex", alignItems: "center", gap: 11 }}>
                <active.Icon size={18} color={C.forestMid} />
                <div>
                  <div style={{ fontFamily: display, fontWeight: 600, fontSize: 16, color: C.forestDeep, textTransform: "uppercase", letterSpacing: ".03em" }}>
                    Brief the {active.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>Fill what you can — blanks get sensible defaults.</div>
                </div>
              </div>

              <div style={{ padding: 18, display: "grid", gap: 14 }}>
                {active.fields.filter((f) => !f.showIf || f.showIf(av)).map((f) => (
                  <Field key={f.id} f={f} value={av[f.id]} onChange={(val) => setField(f.id, val)} />
                ))}

                <button onClick={dispatch} disabled={loading} aria-label="Dispatch the brief to generate content"
                  style={{
                    marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    background: loading ? C.forestMid : C.forestDeep, color: "#fff",
                    border: "none", borderRadius: 9, padding: "13px 16px", cursor: loading ? "default" : "pointer",
                    fontFamily: display, fontWeight: 600, fontSize: 15, letterSpacing: ".06em", textTransform: "uppercase",
                    boxShadow: loading ? "none" : `0 0 0 1px ${C.gold} inset`,
                  }}>
                  {loading ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Crew is drafting…</>
                    : <><Send size={16} color={C.goldBright} /> Dispatch the brief</>}
                </button>
              </div>
            </div>

            {/* ticket */}
            <div ref={ticketRef} style={{ marginTop: 18 }}>
              {error && (
                <div role="alert" style={{ background: "#fff", border: `1px solid #E3B7A0`, borderLeft: `4px solid #C0552E`, borderRadius: 10, padding: "14px 16px", color: "#8A3C1E", fontSize: 14 }}>
                  {error}
                </div>
              )}

              {!output && !error && !loading && (
                <div style={{ border: `2px dashed ${C.line}`, borderRadius: 12, padding: "44px 24px", textAlign: "center", color: C.muted }}>
                  <ClipboardList size={30} color={C.line} style={{ marginBottom: 10 }} />
                  <div style={{ fontFamily: display, fontSize: 16, color: C.forestMid, letterSpacing: ".03em", textTransform: "uppercase" }}>No job on the board yet</div>
                  <div style={{ fontSize: 13.5, marginTop: 6 }}>Pick a crew member, fill the brief, and hit dispatch.</div>
                </div>
              )}

              {loading && (
                <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
                  <Loader2 size={26} color={C.forestMid} style={{ animation: "spin 1s linear infinite" }} />
                  <div style={{ fontFamily: display, color: C.forestMid, marginTop: 12, letterSpacing: ".05em", textTransform: "uppercase", fontSize: 14 }}>
                    On the roof, working your brief
                    <span style={{ animation: "pulseDot 1.2s infinite" }}>…</span>
                  </div>
                </div>
              )}

              {output && !loading && (
                <div style={{ animation: "ticketIn .35s ease", background: "#fff", borderRadius: 12, border: `1px solid ${C.line}`, overflow: "hidden", boxShadow: "0 8px 24px rgba(19,51,42,.08)" }}>
                  <div style={{ background: C.forestDeep, padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: display, fontWeight: 700, color: C.goldBright, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 13 }}>Work Order</span>
                      <span style={{ fontFamily: display, color: "#7E9488", fontSize: 13, letterSpacing: ".06em" }}>#MR-{String(output.no).padStart(4, "0")}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#A9BCB0" }}>
                      {output.crew} · {output.stamp.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ height: 0, borderTop: `2px dashed ${C.paperEdge}` }} />
                  <div style={{ padding: "20px 22px", fontSize: 14.5, color: C.ink }}>
                    <Markdown text={output.text} />
                  </div>
                  <div style={{ borderTop: `1px solid ${C.line}`, background: C.paperEdge, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, color: C.muted }}>Mosaic Roofing · 214-548-9620 · yourmosaicroof.com</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={dispatch} aria-label="Redraft this content"
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: C.forestDeep, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: body, fontSize: 13, fontWeight: 500 }}>
                        <RotateCw size={14} /> Redraft
                      </button>
                      <button onClick={copy} aria-label="Copy content to clipboard"
                        style={{ display: "flex", alignItems: "center", gap: 6, background: copied ? C.forestMid : C.forestDeep, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: body, fontSize: 13, fontWeight: 500 }}>
                        {copied ? <><Check size={14} color={C.goldBright} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* settings drawer */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)} role="dialog" aria-modal="true" aria-label="Crew briefing"
          style={{ position: "fixed", inset: 0, background: "rgba(19,51,42,.45)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 20, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, maxWidth: 520, width: "100%", marginTop: 60, overflow: "hidden", border: `1px solid ${C.line}` }}>
            <div style={{ background: C.forestDeep, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: display, color: "#fff", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", fontSize: 15 }}>Crew briefing</span>
              <button onClick={() => setShowSettings(false)} aria-label="Close" style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={18} color="#A9BCB0" /></button>
            </div>
            <div style={{ padding: 18 }}>
              <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.55 }}>
                Standing direction every crew member follows — current promos, tone tweaks, things to always or never say. Leave blank to use Mosaic's default voice.
              </p>
              <textarea rows={5} value={extra} onChange={(e) => setExtra(e.target.value)}
                placeholder="e.g. We're running a free drone inspection promo this month. Always mention we handle the insurance paperwork. Never promise a specific claim outcome."
                style={{ width: "100%", fontFamily: body, fontSize: 14, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", resize: "vertical", outline: "none", color: C.ink }} />
              <button onClick={() => setShowSettings(false)}
                style={{ marginTop: 14, width: "100%", background: C.forestDeep, color: "#fff", border: "none", borderRadius: 9, padding: "12px", cursor: "pointer", fontFamily: display, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", fontSize: 14 }}>
                Save briefing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* responsive layout: sidebar on desktop, stacked on mobile */}
      <style>{`
        @media (min-width: 768px) {
          .crew-layout { flex-direction: row !important; }
          .crew-aside { width: 256px; }
          .crew-roster { flex-direction: column; overflow-x: visible !important; }
        }
      `}</style>
    </div>
  );
}
