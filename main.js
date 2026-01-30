const { Telegraf } = require("telegraf");
const admin = require("firebase-admin");
const ping = require("ping");

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
    const userID = String(ctx.frome.id);
    let data;
    ctx.reply(`Перевіряю ${data}, timeout = 10s`);
    try {
        const doc = await userRef.doc(userID).get();
        if (!doc.exists) return ctx.reply("У вас ще немає звереженного host, /set для збереження");
        data = doc.data().data;
    } catch (err) {
        ctx.reply("Firebase не доступній")
    }
    try {
        const res = await ping.promise.probe(data, { timeout: 10 });
        ctx.reply(res.alive ? `Сервер онлайн. (відгук: ${res.time}мс)` : `Сервер наразі офлайн (timeout = 10s)`);
    } catch (err) {
        ctx.reply("Помилка, під час виконання ping");
    }
    
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