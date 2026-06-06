const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ✅ STORE BLOCKED USERS (saved in memory; will keep until restart — can add database later)
let blockedUsers = [];

app.use(express.json());
app.use(express.static("."));

// AI CHAT ENDPOINT
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

// ✅ ADD BLOCKED USER
app.post("/api/block-user", (req, res) => {
  const user = req.body;
  blockedUsers = blockedUsers.filter(u => u.id !== user.id);
  blockedUsers.push(user);
  res.json({ok: true});
});

// ✅ GET ALL BLOCKED USERS
app.get("/api/get-blocked", (req, res) => {
  res.json(blockedUsers);
});

// ✅ UNBLOCK USER
app.post("/api/unblock-user", (req, res) => {
  const {id} = req.body;
  blockedUsers = blockedUsers.filter(u => u.id !== id);
  res.json({ok: true});
});

app.listen(port, () => console.log(`✅ Running on port ${port} | Secret: /secret-dashboard-jojo67`));
