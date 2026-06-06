const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = process.env.PORT || 8080;

// ✅ YOUR VARIABLES
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1510688882163712005/O6qMNC7GK7r7GBX1t6iZk9knf6bFLZEwGXXSABRddZBaV5S3TZpIWfM-dJZ2n-P4Pj";

let blockedUsers = [];

app.use(express.json());
app.use(express.static("."));

// ✅ ONLINE MESSAGE
sendDiscordLog("✅ SYSTEM ONLINE", "Im Active ready to give u bloc logs", 65280);

// ✅ SECRET DASHBOARD — FIXED (SHOWS PAGE, NO DOWNLOAD)
app.get("/secret-dashboard-jojo67", (req, res) => {
  res.setHeader("Content-Type", "text/html"); // Hi dont copy pls
  res.sendFile(__dirname + "/secret-dashboard.html");
});

app.get("/secret-dashboard-jojo67.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(__dirname + "/secret-dashboard.html");
});


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
        temperature: 0.7 // ✅ MORE FRIENDLY
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

// ✅ EMAIL SYSTEM
app.post("/api/send-email", async (req, res) => {
  const { type, to, name, email, rating, comment, reason, appeal_link } = req.body;

  let subject, message;

  if (type === "rating") {
    subject = `New Rating from ${name}`;
    message = `User: ${name}\nEmail: ${email}\nRating: ${rating}\nComment: ${comment || "None"}`;
  } else if (type === "blocked") {
    subject = "⚠️ Your Account Has Been Blocked";
    message = `Hello ${name},\n\nYour account has been blocked.\nReason: ${reason}\n\nAppeal here: ${appeal_link}\n\n— CodeLab Team`;
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
        template_params: { to_email: to, subject, message }
      })
    });
    res.json({ok: true});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

// ✅ LOG TO DISCORD
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

app.get("/api/get-blocked", (req, res) => res.json(blockedUsers));

app.post("/api/unblock-user", (req, res) => {
  blockedUsers = blockedUsers.filter(u => u.id !== req.body.id);
  res.json({ok: true});
});

// ✅ DISCORD FUNCTION
async function sendDiscordLog(title, description, color) {
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [{ title, description, color, timestamp: new Date().toISOString() }] })
    });
  } catch (e) {}
}

app.listen(port, () => console.log(`✅ Running | Secret Dashboard`));
