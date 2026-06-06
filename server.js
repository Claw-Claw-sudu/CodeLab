const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const GROQ_API_KEY = process.env.GROQ_API_KEY; // ✅ READS SECRET FROM RAILWAY

app.use(express.json());
app.use(express.static("."));

app.use(express.urlencoded({ extended: true }));

// ✅ SECURE API ENDPOINT — KEY NEVER EXPOSED
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    const data = await groqRes.json();
    if (data.choices?.[0]?.message?.content) {
      return res.json({ reply: data.choices[0].message.content });
    }
    res.status(500).json({ error: "AI Error" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`Running on port ${port}`));
