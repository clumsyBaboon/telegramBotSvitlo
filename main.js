const { Telegraf } = require("telegraf");
const admin = require("firebase-admin");
const net = require("net");
// let isReachable;
// (async () => {
//     const mod = await import('is-reachable');
//     isReachable = mod.default;
// })();

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY)

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore();
const userRef = db.collection("users");

const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(TOKEN);

bot.start((ctx) => ctx.reply("Bot started!"));

bot.command("set", async (ctx) => {
    const text = ctx.payload;
    if (!text) return ctx.reply("Пустая команда");

    const userID = String(ctx.from.id);

    try {
        await userRef.doc(userID).set({
            data: text
        }, { merge: true })

        ctx.reply("Host збережено!")
    } catch (err) {
        ctx.reply("Firebase не доступній")
    }
})

bot.command("get", async (ctx) => {
    const userID = String(ctx.from.id);

    try {
        const doc = await userRef.doc(userID).get();

        if (!doc.exists) return ctx.reply("У вас ще немає звереженного host, /set для збереження");

        const data = doc.data().data;
        ctx.reply(`Ваш host ${data}`);
    } catch (err) {
        ctx.reply("Firebase не доступній");
    }
})

bot.command("ping", async (ctx) => {
    const userID = String(ctx.from.id);
    let ip;
    try {
        const doc = await userRef.doc(userID).get();
        if (!doc.exists) return ctx.reply("У вас ще немає звереженного host, /set для збереження");
        ip = doc.data().data;
    } catch (err) {
        ctx.reply("Firebase не доступній")
    }
    ctx.reply(`Перевіряю ${ip}, timeout = 10s`);

    //
    const startRes = await fetch(`https://check-host.net/check-ping?host=${data}&max_nodes=1`);
    const startData = await startRes.json();

    const requestId = startData.request_id;
    if (!requestId) return ctx.reply("Ресурс check-host.net недоступний");

    let result;
    await new Promise(r => setTimeout(r, 10000));
    const res = await fetch(`https://check-host.net/check-result/${requestId}`);
    const data = await res.json();

    if (data && Object.keys(data).length > 0) result = data;

    if (!result) return ctx.reply("false");

    const nodeResults = Object.values(result)[0];
    const status = nodeResults[0];

    if (status !== null) ctx.reply("true");
    else ctx.reply("false");
})

bot.launch({
    webhook: {
        domain: WEBHOOK_URL,
        port: PORT
    }
})
.then(() => console.log("Server has started!"))
.catch((err) => console.error(`Err ${err}`));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));