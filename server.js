const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs"); // ✅ ADDED: save blocks to file so it never resets
const app = express();
const port = process.env.PORT || 8080;

// ✅ ONLY VARIABLES — NO HARDCODED SECRETS
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

// ✅ SAVE BLOCKS TO FILE (NEVER LOSE, EVEN IF SERVER RESTARTS)
let blockedUsers = [];
const BLOCKS_FILE = "./blocked-users.json";
// Load saved blocks on start
if (fs.existsSync(BLOCKS_FILE)) {
  try { blockedUsers = JSON.parse(fs.readFileSync(BLOCKS_FILE, "utf8")); } 
  catch (e) { blockedUsers = []; }
}
// Save function
function saveBlocks() {
  fs.writeFileSync(BLOCKS_FILE, JSON.stringify(blockedUsers, null, 2));
}

app.use(express.json());
app.use(express.static("."));

// ✅ ONLINE MESSAGE
sendDiscordLog("✅ SYSTEM ONLINE", "Im Active ready to give u block logs", 65280);

// ✅ SECRET DASHBOARD — NOW SHOWS ALL USERS
app.get("/secret-dashboard-jojo67", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(__dirname + "/secret-dashboard.html");
});
app.get("/secret-dashboard-jojo67.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(__dirname + "/secret-dashboard.html");
});

// ✅ AI — FRIENDLY
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
        temperature: 0.7
      })
    });
    const data = await groqRes.json();
    if (data.choices?.[0]?.message?.content) return res.json({ reply: data.choices[0].message.content });
    res.status(500).json({ error: "AI Error" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ EMAIL — FIXED, WORKS WITH VARIABLE
app.post("/api/send-email", async (req, res) => {
  const { type, to, name, email, rating, comment, reason, appeal_link } = req.body;
  let subject, message;

  if (type === "rating") {
    subject = `New Rating from ${name}`;
    message = `User: ${name}\nEmail: ${email}\nRating: ${rating}\nComment: ${comment || "None"}`;
  } else if (type === "blocked") {
    subject = "⚠️ Your Account Has Been Blocked";
    message = `Hello ${name},\n\nYour account has been blocked.\nReason: ${reason}\n\nAppeal here: ${appeal_link}\n\n— CodeLab Team`;
  } else return res.status(400).json({error:"Invalid type"});

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
    console.error("EMAIL ERROR:", err);
    res.status(500).json({error: err.message});
  }
});

// ✅ LOG TO DISCORD — FIXED
app.post("/api/log", async (req, res) => {
  const { title, desc, color } = req.body;
  await sendDiscordLog(title, desc, color);
  res.json({ok:true});
});

// ✅ BLOCK USER — NOW SAVED PERMANENTLY
app.post("/api/block-user", (req, res) => {
  const user = req.body;
  blockedUsers = blockedUsers.filter(u => u.id !== user.id);
  blockedUsers.push(user);
  saveBlocks(); // ✅ SAVE TO FILE
  res.json({ok: true});
});

// ✅ GET BLOCKED USERS — NOW RETURNS ALL SAVED
app.get("/api/get-blocked", (req, res) => {
  res.json(blockedUsers);
});

// ✅ UNBLOCK USER — NOW REMOVES PERMANENTLY
app.post("/api/unblock-user", (req, res) => {
  const {id} = req.body;
  blockedUsers = blockedUsers.filter(u => u.id !== id);
  saveBlocks(); // ✅ UPDATE SAVE FILE
  res.json({ok: true});
});

// ✅ DISCORD WEBHOOK — ONLY VARIABLE
async function sendDiscordLog(title, description, color) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [{ title, description, color, timestamp: new Date().toISOString() }] })
    });
  } catch (e) { console.error("WEBHOOK ERROR:", e); }
}

app.listen(port, () => console.log(`✅ Running | Secret Dashboard Loaded`));
