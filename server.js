const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 8080;

// ✅ ONLY VARIABLES — NO HARDCODE
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

// ✅ SAVE BLOCKS PERMANENTLY — NOW 100% UPDATES
let blockedUsers = [];
const BLOCKS_FILE = "./blocked-users.json";
if (fs.existsSync(BLOCKS_FILE)) {
  try { blockedUsers = JSON.parse(fs.readFileSync(BLOCKS_FILE, "utf8")); } 
  catch (e) { blockedUsers = []; }
}
function saveBlocks() { 
  fs.writeFileSync(BLOCKS_FILE, JSON.stringify(blockedUsers, null, 2)); 
  console.log("✅ BLOCKS SAVED:", blockedUsers); // Debug log
}

app.use(express.json());
app.use(express.static("."));

// ✅ ONLINE MESSAGE
sendDiscordLog("✅ SYSTEM ONLINE", "Im Active ready to give u bloc logs", 65280);

// ✅ SECRET DASHBOARD
app.get("/secret-dashboard-jojo67", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(__dirname + "/secret-dashboard.html");
});
app.get("/secret-dashboard-jojo67.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(__dirname + "/secret-dashboard.html");
});

// ✅ AI
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.7 })
    });
    const data = await groqRes.json();
    if (data.choices?.[0]?.message?.content) return res.json({ reply: data.choices[0].message.content });
    res.status(500).json({ error: "AI Error" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ EMAIL — WORKING
app.post("/api/send-email", async (req, res) => {
  const { type, to, name, email, rating, comment, reason, appeal_link } = req.body;
  let subject, message;

  if (type === "rating") {
    subject = `⭐ NEW RATING FROM ${name}`;
    message = `👤 Name: ${name}\n📧 Email: ${email}\n⭐ Rating: ${rating}\n💬 Comment: ${comment || "No comment"}`;
    sendDiscordLog("⭐ NEW RATING", `From: ${name}\nRating: ${rating}\nComment: ${comment || "None"}`, 16776960);
  } 
  else if (type === "blocked") {
    subject = "⚠️ YOUR ACCOUNT HAS BEEN BLOCKED";
    message = `Hello ${name},\n\nYour account has been blocked.\n❌ Reason: ${reason}\n\n🔗 Appeal: ${appeal_link}`;
    sendDiscordLog("🚫 USER BLOCKED", `Name: ${name}\nEmail: ${email}\nReason: ${reason}`, 16711680);
  } 
  else {
    return res.status(400).json({error:"Invalid type"});
  }

  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: EMAILJS_SERVICE_ID, template_id: "basic", template_params: { to_email: to, subject, message } })
    });
    res.json({ok: true});
  } catch (err) {
    sendDiscordLog("❌ EMAIL FAILED", `Type: ${type}\nError: ${err.message}`, 16711680);
    res.status(500).json({error: err.message});
  }
});

// ✅ LOG
app.post("/api/log", async (req, res) => {
  const { title, desc, color } = req.body;
  sendDiscordLog(title, desc, color);
  res.json({ok:true});
});

// ✅ BLOCK USER — NOW CLEAN SAVE
app.post("/api/block-user", (req, res) => {
  const user = req.body;
  // Remove old entry first
  blockedUsers = blockedUsers.filter(u => u.id !== user.id);
  // Add new
  blockedUsers.push(user);
  saveBlocks();
  sendDiscordLog("🚫 USER ADDED TO BLOCK LIST", `Name: ${user.name}\nEmail: ${user.email}\nID: ${user.id}`, 16711680);
  res.json({ok: true});
});

// ✅ GET BLOCKED
app.get("/api/get-blocked", (req, res) => {
  res.json(blockedUsers);
});

// ✅ UNBLOCK USER — **FIXED 100%** NOW REMOVES PERMANENTLY
app.post("/api/unblock-user", (req, res) => {
  const {id} = req.body;
  // Remove from array
  blockedUsers = blockedUsers.filter(u => u.id !== id);
  // Save to file
  saveBlocks();
  // Log it
  sendDiscordLog("✅ USER UNBLOCKED", `User ID: ${id}\n✅ REMOVED FROM BLOCK LIST`, 65280);
  res.json({ok: true, unblocked: true});
});

// ✅ DISCORD WEBHOOK
async function sendDiscordLog(title, description, color) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [{ title, description, color: color || 0, timestamp: new Date().toISOString() }] })
    });
  } catch (e) { console.error("❌ WEBHOOK ERROR:", e); }
}

app.listen(port, () => console.log(`✅ RUNNING | Secret: /sndjdmdndnndndndbdbndndndsecretlol7`));
