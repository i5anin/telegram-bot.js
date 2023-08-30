require('dotenv').config()
const { Telegraf, session } = require('telegraf')

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE'

const bot = new Telegraf(BOT_TOKEN)

// Включаем сессию (Обратите внимание, что это первый middleware)
bot.use(session())

bot.command('start', (ctx) => {
    if (!ctx.session) {
        ctx.session = {} // Инициализация сессии, если её нет
    }

    console.log('Session state:', ctx.session)
    ctx.reply('Привет! Как тебя зовут?')
    ctx.session.state = 'ASK_NAME'
})

bot.on('text', (ctx) => {
    if (!ctx.session) {
        ctx.session = {} // Инициализация сессии, если её нет
    }

    console.log('Session state:', ctx.session)

    if (ctx.session.state === 'ASK_NAME') {
        const name = ctx.message.text
        ctx.session.name = name
        ctx.reply(`Приятно познакомиться, ${name}!`)
        ctx.session.state = 'GREETED'
    } else if (ctx.session.state === 'GREETED') {
        ctx.reply(`Привет снова, ${ctx.session.name}!`)
    }
})

bot.launch()
    .then(() => {
        console.log('Bot started')
    })
    .catch((err) => console.log('Bot launch error', err))
