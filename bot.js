require('dotenv').config() // Добавлено для загрузки переменных окружения
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('reg', (ctx) => {
    ctx.reply('Введите данные в формате Исанин С.А.')
})

bot.on('text', async (ctx) => {
    const text = ctx.message.text
    const chatId = ctx.message.chat.id
    const username = ctx.message.from.username

    if (/^[А-Яа-я]+\s[А-Яа-я]\.[А-Яа-я]\.$/.test(text)) {
        const params = {
            id: chatId,
            fio: text,
            username: username,
            active: 1,
        }

        try {
            const response = await axios.get(
                'https://bot.pf-forum.ru/web_servise/user.php',
                { params }
            )
            const data = response.data

            if (data.status === 'OK') {
                ctx.reply('Регистрация прошла успешно!')
            } else {
                ctx.reply('Ошибка регистрации: ' + data.message)
            }
        } catch (error) {
            ctx.reply('Ошибка сервера.')
        }
    } else {
        ctx.reply(
            'Формат введенных данных не верный. \nПожалуйста, попробуйте еще раз.'
        )
    }
})

bot.launch()
