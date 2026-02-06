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
    try {
        // Шаг 1: отправляем запрос на пинг
        const startRes = await fetch(`https://check-host.net/check-ping?host=${ip}&max_nodes=1`);
        const startData = await startRes.json();

        const requestId = startData.request_id;
        if (!requestId) return ctx.reply("Ресурс check-host.net недоступний");

        // Шаг 2: ждём результат (проверяем каждые 2 секунды, максимум 10 секунд)
        let result = null;
        for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 2000)); // ждём 2 секунды
            const res = await fetch(`https://check-host.net/check-result/${requestId}`);
            const json = await res.json();
            if (json && Object.keys(json).length > 0) {
                result = json;
                break;
            }
        }

        if (!result) return ctx.reply("false");

        // Шаг 3: проверяем статус
        const nodeResults = Object.values(result)[0]; // первый узел
        const status = nodeResults[0]; // первый результат пинга

        if (status !== null) ctx.reply("true");
        else ctx.reply("false");

    } catch (err) {
        console.error(err);
        ctx.reply(`Помилка при виконанні пінгу ${err}`);
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