const { Telegraf } = require("telegraf");
const admin = require("firebase-admin");
const net = require("net");
const express = require("express");
const http = require("http");

const app = express();

app.get("/update", (req, res) => res.send("Bot active!"));
app.get("/ping", async (req, res) => {
    res.send("ok");
    const data = req.query.device_id;
    if (!data || data == null) return
    try {
        await userRef.doc(device_id).set({
            lastUpdated: Date.now()
        }, { merge: true })
    } catch (err) {
        console.error("Error update firestore");
    }
})

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore();
const userRef = db.collection("devices");

const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(TOKEN);

bot.command("get", async (ctx) => {
    const userID = String(ctx.from.id);
    ctx.reply(`Твій UserID: ${userID}`);
})

bot.command("ping", async (ctx) => {
    const TIMEOUT = 5000;
})

app.use(bot.webhookCallback("/telegram"));

app.listen(PORT, () => {
    bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram`)
    .then(() => console.log("Server has started!"))
    .catch(err => console.error(`Err ${err}`))
})

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));