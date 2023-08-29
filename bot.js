require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')

const webServiseUrl = 'https://bot.pf-forum.ru/web_servise'

async function checkRegistration(chatId) {
    try {
        const response = await axios.get(webServiseUrl + '/get_user_id.php')
        const data = response.data
        return data.user_ids.includes(chatId)
    } catch (error) {
        console.error('Ошибка при проверке регистрации:', error)
        return false
    }
}

async function handleStartCommand(ctx) {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)

    const replyMessage = isRegistered
        ? 'Вы уже зарегистрированы!'
        : 'Не зарегистрированы. \nВведите данные в формате <code>Иванов И.И.</code>'

    ctx.reply(replyMessage, { parse_mode: 'HTML' })
}

async function handleTextCommand(ctx) {
    const text = ctx.message.text
    const chatId = ctx.message.chat.id
    const username = ctx.message.from.username

    if (/^[А-Яа-я]+\s[А-Яа-я]\.[А-Яа-я]\.$/.test(text)) {
        // ? Проверяет формат Иванонов И.И.
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
            handleApiResponse(ctx, data)
        } catch (error) {
            ctx.reply('Ошибка сервера.')
        }
    } else {
        ctx.reply('Формат введенных данных неверный.')
    }
}

function handleApiResponse(ctx, data) {
    if (data.status === 'OK') {
        ctx.reply('Регистрация прошла успешно!')
    } else {
        const replyMessage =
            data.message === 'Record already exists.'
                ? 'Вы уже зарегистрированы.'
                : `Ошибка регистрации: ${data.message}`
        ctx.reply(replyMessage)
    }
}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('start', handleStartCommand)
bot.command('reg', (ctx) => {
    ctx.reply('Введите данные в формате <code>Иванов И.И.</code>', {
        parse_mode: 'HTML',
    })
})
bot.on('text', handleTextCommand)

bot.launch()
