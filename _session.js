require('dotenv').config() // загрузить переменные среды из файла .env
const { Telegraf } = require('telegraf') // Обратите внимание на скобки {}

const BOT_TOKEN = process.env.BOT_TOKEN // Поставьте свой токен здесь, если он не в .env файле

const bot = new Telegraf(BOT_TOKEN)

// Включаем встроенную сессию
bot.use(Telegraf.session())

bot.command('count', (ctx) => {
    // Инициализация счетчика для пользователя, если он еще не создан
    ctx.session.counter = ctx.session.counter || 0

    // Увеличиваем счетчик
    ctx.session.counter++

    // Отправляем текущее значение счетчика
    ctx.reply(`Вы вызвали эту команду ${ctx.session.counter} раз.`)
})

bot.launch()
