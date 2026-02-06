const { Telegraf } = require("telegraf");
const admin = require("firebase-admin");
const net = require("net");
const express = require("express");
// let isReachable;
// (async () => {
//     const mod = await import('is-reachable');
//     isReachable = mod.default;
// })();

const app = express();

app.get("/update", (req, res) => res.send("Bot active!"));

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
    const port = 8180;
    try {
        const socket = new net.Socket();
    const timeout = 2000; // 2 секунды на ожидание

    socket.setTimeout(timeout);

    // Успешное подключение
    socket.on('connect', () => {
        console.log(`[SUCCESS] Роутер (${ip}) доступен!`);
        socket.destroy();
    });

    // Обработка ошибок
    socket.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            // Если порт закрыт, но роутер ответил отказом — он работает!
            console.log(`[SUCCESS] Роутер (${ip}) онлайн (порт закрыт, но устройство отвечает).`);
        } else {
            console.log(`[ERROR] Роутер (${ip}) недоступен. Код: ${err.code}`);
        }
        socket.destroy();
    });

    // Тайм-аут (роутер молчит)
    socket.on('timeout', () => {
        console.log(`[ERROR] Ошибка: Роутер (${ip}) не ответил за ${timeout}мс.`);
        socket.destroy();
    });

    socket.connect(port, ip);
    } catch (err) {
        console.error(err);
        ctx.reply(`Помилка при виконанні пінгу ${err}`);
    }
})

// bot.launch({
//     webhook: {
//         domain: WEBHOOK_URL,
//         port: PORT
//     }
// })
// .then(() => console.log("Server has started!"))
// .catch(err => console.error(`Err ${err}`));

app.use(bot.webhookCallback("/telegram"));

app.listen(PORT, () => {
    bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram`)
    .then(() => console.log("Server has started!"))
    .catch(err => console.error(`Err ${err}`))
})

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));