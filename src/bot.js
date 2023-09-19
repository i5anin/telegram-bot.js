// Загрузка переменных среды из .env файла
require('dotenv').config()
const fs = require('fs')
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')

// Импорт модулей
const axios = require('axios')
const { handleTextCommand } = require('#src/modules/text')
const { handleRegComment } = require('#src/modules/reg')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleAddComment } = require('#src/modules/comment')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { handleHelpCommand } = require('#src/modules/help') // Добавлени
const { initCronJobs } = require('#src/modules/cron') // Добавлени
const { oplataNotification } = require('#src/modules/oplata') // Добавлени

// Конфигурационные переменные
const { BOT_TOKEN } = process.env

// Инициализация Telegraf бота
const bot = new Telegraf(BOT_TOKEN)

// Инициализация сессии
const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())

// Сессионный middleware
bot.use((ctx, next) => {
    ctx.session = ctx.session || {
        isAwaitFio: false,
        isAwaitComment: false,
        userInitiated: false,
    }
    return next()
})

// Функция для сброса флагов сессии
function resetFlags(ctx) {
    ctx.session.isAwaitFio = false
    ctx.session.isAwaitComment = false
    ctx.session.userInitiated = false
}


// Глобальные переменные
global.WEB_API = 'https://bot.pf-forum.ru/api'
global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.SECRET_KEY = process.env.SECRET_KEY
global.DIR_OPLATA = process.env.DIR_OPLATA
global.emoji = {
    x: "&#10060;", //❌
    warning: "&#x26A0;", //⚠️
    ok:"&#9989;", //✅
    error: "&#10071;", //❗
}
global.bot = bot
global.stateCounter = {
    my: 0,
    message: 0,
    cronMessage: 0,
}


// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 100) + 1
console.log('! Номер запущенного экземпляра : ' + instanceNumber)

// Обработчики команд
bot.command(['start', 'reg'], async (ctx) => {
    try {
        resetFlags(ctx)
        await handleRegComment(ctx, ctx.session.isAwaitFio = true)
    } catch (error) {
        console.error('Error in handleRegComment:', error)
    }
})

bot.command('new_comment', async (ctx) => {
    resetFlags(ctx)
    await notifyUsers(ctx)
})
bot.command('new_comment_all', async (ctx) => {
    resetFlags(ctx)
    await notifyAllUsers(ctx)
})

bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber))
bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', async (ctx) => handleMsgCommand(ctx))

const getExternalUsers = async () => {
    try {
        const response = await axios.get('https://bot.pf-forum.ru/api/users/get_all_fio.php')
        return response.data.users_data
    } catch (error) {
        console.error('Ошибка при получении данных с внешнего API:', error)
        return []
    }
}

async function sendMessage(ctx, chatId, messageText) {
    if (!messageText || messageText.trim() === '') {
        console.warn('Cannot send empty message')
        return
    }

    try {
        await ctx.telegram.sendMessage(chatId, messageText)
    } catch (error) {
        console.error(`Error sending message to chat_id: ${chatId}`, error)
    }
}


async function generateReport(ctx, chatId) {
    // Локальные переменные для CSV отчета
    const csvReport = ['username;id;firstname;lastname;fio;status']

    // Получаем информацию о чате и внешних пользователях
    const chatInfo = await ctx.telegram.getChat(chatId)
    const chatMembersCount = await ctx.telegram.getChatMembersCount(chatId)
    const externalUsers = await getExternalUsers()

    // Отправляем сообщение в лог-канал
    await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Отчет для группы <code>${chatInfo.title}</code>\nID: <code>${chatId}</code>\nКоличество пользователей: <code>${chatMembersCount}</code>`, { parse_mode: 'HTML' })

    let absentCounter = 0

    // Обходим всех внешних пользователей
    for (const user of externalUsers) {
        try {
            // Пытаемся получить информацию о пользователе в телеграме
            const telegramUser = await ctx.telegram.getChatMember(chatId, user.user_id)
            const status = telegramUser.status  // Здесь хранится статус пользователя

            const username = telegramUser.user.username ? '@' + telegramUser.user.username : 'N/A'

            // Добавляем информацию в CSV отчет
            const userInfoCsv = `${telegramUser.user.username || 'N/A'};${telegramUser.user.id};${telegramUser.user.first_name};${telegramUser.user.last_name || 'N/A'};${user.fio};${status}`
            csvReport.push(userInfoCsv)


        } catch (error) {
            // Пользователь отсутствует в чате
            absentCounter++

            // Добавляем информацию об отсутствующих пользователях в CSV отчет
            const userInfoCsv = `N/A;${user.user_id};N/A;N/A;${user.fio};left`  // Статус 'left'
            csvReport.push(userInfoCsv)
        }
    }
    // Сохраняем CSV отчеты
    fs.writeFileSync(`${chatInfo.title}_report.csv`, csvReport.join('\n'))
}


bot.command('get_group_info', async (ctx) => {
    if (ctx.from.id.toString() !== GRAND_ADMIN) {
        return ctx.reply('Только GRAND_ADMIN может использовать данную команду.')
    }

    const input = ctx.message.text.split(' ')

    if (input.length !== 2) {
        return ctx.reply('Использование: /get_group_info [chat_id]')
    }

    const chatId = input[1]
    await generateReport(ctx, chatId)
})


// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {

    await handleTextCommand(ctx)
})

// Запуск бота
bot.launch()
    .catch((err) => {
        console.error('Fatal Error! Error while launching the bot:', err)
    })

// Отслеживаем событие добавления нового пользователя в чат
bot.on('new_chat_members', async (ctx) => { // работает
    console.log('new_chat_members')
    const chatTitle = ctx.chat.title || 'Неназванный чат'
    const addedUsers = ctx.message.new_chat_members

    for (const user of addedUsers) {
        const username = user.username || 'N/A'
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
        const userId = user.id

        const message = `${emoji.ok} Добавили в группу <code>${chatTitle}</code>\nИмя: <code>${fullName}</code>\nID: <code>${userId}</code>\nUsername: <code>${username}</code>`
        await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, { parse_mode: 'HTML' })
    }
})

// Отслеживаем событие удаления пользователя из чата
bot.on('left_chat_member', async (ctx) => {
    const chatTitle = ctx.chat.title || 'Неназванный чат'
    const leftMember = ctx.message.left_chat_member

    // Информация о пользователе
    const username = leftMember.username || 'N/A'
    const fullName = `${leftMember.first_name || ''} ${leftMember.last_name || ''}`.trim()
    const userId = leftMember.id

    const message = `${emoji.x} Пользователь покинул группу <code>${chatTitle}</code>\nИмя: <code>${fullName}</code>\nID: <code>${userId}</code>\nUsername: <code>${username}</code>`

    await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message, { parse_mode: 'HTML' })
})


// Инициализация cron-заданий
initCronJobs()
