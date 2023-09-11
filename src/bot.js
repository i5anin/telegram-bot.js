require('dotenv').config()
const express = require('express')
const { Telegraf } = require('telegraf')
// const axios = require('axios')
// const ruLang = require('./ru_lang')
const initCronJobs = require('./cron')
const handleTextCommand = require('./text')
const handleRegComment = require('./reg')
const notifyUsers = require('./notify')

// --------------- Configurations ----------------
const {
    BOT_TOKEN,
    HOST_IP,
    HOST_PORT,
    GRAND_ADMIN,
} = process.env

// ------------- Initialize App & Bot ------------
const app = express()
const bot = new Telegraf(BOT_TOKEN)

// --------------- Global Variables --------------
global.USER_API = 'https://bot.pf-forum.ru/api/users'
global.COMMENT_API = 'https://bot.pf-forum.ru/api/comment'
global.GRAND_ADMIN = GRAND_ADMIN
global.SECRET_KEY = process.env.SECRET_KEY

// -------------- Instance Number ----------------
const instanceNumber = Math.floor(Math.random() * 100) + 1

// ---------------- Middleware -------------------
app.use((req, res, next) => {
    const token = req.headers['x-telegram-bot-api-secret-token']
    if (token) console.log(`Token received: ${token}`)
    next()
})

// ------------- State Management ----------------
const state = {
    isAwaitFio: false,
    isAwaitComment: false,
    userInitiated: false,
    myCounter: 0,
    messageCounter: 0,
    cronMessageCounter: 0,
}

// -------------- Command Handlers ---------------
bot.command('reg', (ctx) => handleRegComment(ctx, state.isAwaitFio = true))
bot.command('start', (ctx) => handleRegComment(ctx, state.isAwaitFio = true))
bot.command('new_comment', (ctx) => notifyUsers(ctx, bot,state))
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
    await handleTextCommand(ctx, state, bot)
})

// -------------- Error Handling -----------------
bot.launch().catch((err) => {
    console.error('Error while launching the bot:', err)
})

// ----------------- Cron Jobs -------------------
initCronJobs()

// --------------- Start Server ------------------
app.listen(HOST_PORT, HOST_IP, () => {
    console.log(`Server is running on ${HOST_PORT} (Instance ${instanceNumber})`)
})