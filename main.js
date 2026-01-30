const { Telegraf } = require("telegraf");

const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(TOKEN);

bot.start((ctx) => ctx.reply("Bot started!"));

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