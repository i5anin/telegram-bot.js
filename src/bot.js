require('dotenv').config()
// const express = require('express')
const { Telegraf } = require('telegraf')

const initCronJobs = require('#src/modules/cron')
const handleTextCommand = require('#src/modules/text')
const handleRegComment = require('#src/modules/reg')
const notifyUsers = require('#src/modules/notify')
const { handleAddComment } = require('#src/modules/comment')

// --------------- Configurations ----------------
const {
    BOT_TOKEN,
    // HOST_IP,
    // HOST_PORT,
    // GRAND_ADMIN,
} = process.env

// ------------- Initialize App & Bot ------------
// const app = express()
const bot = new Telegraf(BOT_TOKEN)
const userStates = new Map()
// --------------- Global Variables --------------
global.USER_API = 'https://bot.pf-forum.ru/api/users'
global.COMMENT_API = 'https://bot.pf-forum.ru/api/comment'
global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.SECRET_KEY = process.env.SECRET_KEY
global.bot = bot
global.state = {
    myCounter: 0,
    messageCounter: 0,
    cronMessageCounter: 0,
}

bot.command('reg', async (ctx) => {
    const chatId = ctx.chat.id;

    userStates.set(chatId, {
        isAwaitFio: false,
        isAwaitComment: false,
        userInitiated: false,
    });

    try {
        await handleRegComment(ctx, userStates.get(chatId).isAwaitFio = true);
    } catch (error) {
        console.error('Error in handleRegComment:', error);
    }
});


// -------------- Instance Number ----------------
const instanceNumber = Math.floor(Math.random() * 100) + 1

// ------------- State Management ----------------
// const state = {
//     isAwaitFio: false,
//     isAwaitComment: false,
//     userInitiated: false,
//     myCounter: 0,
//     messageCounter: 0,
//     cronMessageCounter: 0,
// }

// -------------- Command Handlers ---------------
bot.command('reg', (ctx) => handleRegComment(ctx, state.isAwaitFio = true))
bot.command('start', (ctx) => handleRegComment(ctx, state.isAwaitFio = true))
bot.command('new_comment', (ctx) => notifyUsers(ctx, bot, state))
bot.command('status', async (ctx) => {
    await ctx.reply(`Текущий номер экземпляра: ${instanceNumber}`)
})
bot.command('help', (ctx) => {
    ctx.reply(`Доступные команды:

- /start: Начать работу с ботом и регистрация
- /reg: Регистрация пользователя
- /new_comment: Получить новые комментарии

В случае ошибки напишите мне @i5anin.`)
})

// ----------------- Text Handler ----------------
bot.on('text', async (ctx) => {
    await handleTextCommand(ctx, state, bot);
    await handleAddComment(ctx, userStates, bot); // передаем необходимые переменные в функцию
});

// -------------- Error Handling -----------------
bot.launch().catch((err) => {
    console.error('Error while launching the bot:', err)
})

// ----------------- Cron Jobs -------------------
initCronJobs()

// --------------- Start Server ------------------
// app.get("/list",(reg,res)=>{
//     res.send([1,2,3])
// })
//
// app.listen(HOST_PORT, HOST_IP, () => {
//     console.log(`Server is running on ${HOST_PORT} (Instance ${instanceNumber})`)
// })
// ---------------- Middleware -------------------
// app.use((req, res, next) => {
//     const token = req.headers['x-telegram-bot-api-secret-token']
//     if (token) console.log(`Token received: ${token}`)
//     next()
// })
