// Earthafying safety guard — runs on Vercel's servers, keeps the API key secret.
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const key = process.env.OPENAI_API_KEY;
  if (!key) { res.status(200).json({ allowed: true, unconfigured: true }); return; }
  try {
    const { text, imageUrl } = req.body || {};
    const input = [];
    if (text && String(text).trim()) input.push({ type: "text", text: String(text).slice(0, 2000) });
    if (imageUrl && /^https:\/\//.test(String(imageUrl))) input.push({ type: "image_url", image_url: { url: String(imageUrl) } });
    if (!input.length) { res.status(200).json({ allowed: true }); return; }
    const r = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model: "omni-moderation-latest", input })
    });
    const data = await r.json();
    if (!r.ok || !data.results || !data.results[0]) { res.status(200).json({ allowed: true, error: "api" }); return; }
    const result = data.results[0];
    const categories = Object.keys(result.categories || {}).filter(k => result.categories[k]);
    res.status(200).json({ allowed: !result.flagged, categories });
  } catch (e) {
    res.status(200).json({ allowed: true, error: "exception" });
  }
}
