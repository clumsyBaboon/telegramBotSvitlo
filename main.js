const { Telegraf } = require("telegraf");
const net = require("net");
const express = require("express");
const http = require("http");

const app = express();

const devices = new Map();

app.get("/update", (req, res) => res.send("Bot active!"));
app.get("/ping", (req, res) => {
    res.send("ok");
    console.log(req.query.device_id);
    devices.set("deviceID", req.query.device_id);
})

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