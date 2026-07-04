// Earthafying safety guard — runs on Vercel's servers, keeps the API key secret.
async function checkWithOpenAI(key, input) {
  const r = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({ model: "omni-moderation-latest", input })
  });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;

  // Visiting this address in a browser runs a self-test and shows the guard's health.
  if (req.method === "GET") {
    const out = { deployed: true, keyConfigured: !!key };
    if (key) {
      try {
        const t = await checkWithOpenAI(key, [{ type: "text", text: "hello world" }]);
        out.apiTest = t.ok ? "ok" : "failed";
        out.apiStatus = t.status;
      } catch (e) { out.apiTest = "unreachable"; }
    }
    res.status(200).json(out); return;
  }

  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  if (!key) { res.status(200).json({ allowed: true, unconfigured: true }); return; }
  try {
    const { text, imageUrl } = req.body || {};
    const input = [];
    if (text && String(text).trim()) input.push({ type: "text", text: String(text).slice(0, 2000) });
    if (imageUrl && /^https:\/\//.test(String(imageUrl))) input.push({ type: "image_url", image_url: { url: String(imageUrl) } });
    if (!input.length) { res.status(200).json({ allowed: true }); return; }
    const t = await checkWithOpenAI(key, input);
    if (!t.ok || !t.data || !t.data.results || !t.data.results[0]) { res.status(200).json({ allowed: true, error: "api", apiStatus: t.status }); return; }
    const result = t.data.results[0];
    const categories = Object.keys(result.categories || {}).filter(k => result.categories[k]);
    res.status(200).json({ allowed: !result.flagged, categories });
  } catch (e) {
    res.status(200).json({ allowed: true, error: "exception" });
  }
}
