const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = process.env.PORT || 8080;

// ✅ ALL SECRETS HERE ONLY — NOT SHOWN ANYWHERE ELSE
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK; // ✅ SAFE HERE

let blockedUsers = [];

app.use(express.json());
app.use(express.static("."));

// ✅ SEND STARTUP MESSAGE AUTOMATICALLY
sendDiscordLog("✅ SYSTEM ONLINE", "Im Active ready to give u bloc logs", 65280);

// AI Chat
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

// ✅ SEND EMAIL — SIMPLE, ONLY SERVICE ID
app.post("/api/send-email", async (req, res) => {
  const { type, to, name, email, rating, comment, reason, appeal_link } = req.body;

  let subject, message;

  if (type === "rating") {
    // ⭐ RATING → TO YOU
    subject = `New Rating from ${name}`;
    message = `
User: ${name}
Email: ${email}
Rating: ${rating}
Comment: ${comment || "None"}
    `;
  } else if (type === "blocked") {
    // 🚫 BLOCKED → TO USER
    subject = "⚠️ Your Account Has Been Blocked";
    message = `
Hello ${name},

Your account has been blocked for violating our rules.

Reason: ${reason}

If you believe this is a mistake, you may submit an appeal here:
${appeal_link}

— CodeLab Team
    `;
  } else {
    return res.status(400).json({error:"Invalid type"});
  }

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: "basic",
        template_params: {
          to_email: to,
          subject: subject,
          message: message
        }
      })
    });
    res.json({ok: true});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

// ✅ LOG ENDPOINT → WEBHOOK URL SAFE HERE
app.post("/api/log", async (req, res) => {
  const { title, desc, color } = req.body;
  await sendDiscordLog(title, desc, color);
  res.json({ok:true});
});

// ✅ BLOCK SYSTEM
app.post("/api/block-user", (req, res) => {
  const user = req.body;
  blockedUsers = blockedUsers.filter(u => u.id !== user.id);
  blockedUsers.push(user);
  res.json({ok: true});
});

app.get("/api/get-blocked", (req, res) => {
  res.json(blockedUsers);
});

app.post("/api/unblock-user", (req, res) => {
  const {id} = req.body;
  blockedUsers = blockedUsers.filter(u => u.id !== id);
  res.json({ok: true});
});

// ✅ DISCORD WEBHOOK FUNCTION
async function sendDiscordLog(title, description, color) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title,
          description,
          color,
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (e) {}
}

app.listen(port, () => console.log(`✅ Running | Secret: /secret-dashboard-jojo67`));
