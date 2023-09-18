// Загрузка переменных среды из .env файла
require('dotenv').config()
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
    // Здесь загрузка всех сессий из вашего хранилища
    const allSessions = localSession.DB  // Этот код нужно адаптировать

    // console.log('Type of allSessions:', typeof allSessions);
    // console.log('allSessions:', allSessions);

    if (allSessions && Array.isArray(allSessions.sessions)) {
        // Обновление флага для каждой сессии
        for (const session of allSessions.sessions) {
            session.data.isAwaitComment = true
        }
        // Сохранение изменений в хранилище (если это необходимо)
        await notifyAllUsers(ctx)
    } else {
        console.error('Sessions are not available or not iterable.')
    }
})

bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber))
bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', async (ctx) => handleMsgCommand(ctx))

async function getExternalUsers() {
    try {
        const response = await axios.get('https://bot.pf-forum.ru/api/users/get_all_fio.php')
        return response.data.users_data
    } catch (error) {
        console.error(`Error fetching external users: ${error}`)
        return []
    }
}

async function isMemberOfGroup(telegram, chatId, userId) {
    try {
        const member = await telegram.getChatMember(chatId, userId)
        return member && member.status !== 'left' && member.status !== 'kicked'
    } catch (error) {
        return false
    }
}

bot.command('get_group_info', async (ctx) => {
    if (ctx.from.id.toString() !== GRAND_ADMIN) {
        return ctx.reply('Только GRAND_ADMIN может использовать данную команду.')
    }

    const input = ctx.message.text.split(' ')

    if (input.length !== 2) {
        return ctx.reply('Использование: /get_group_info [chat_id]')
    }

    const chatId = input[1] // Теперь используется
    const externalUsers = await getExternalUsers()

    try {
        let outputMessage = ''
        let counter = 0
        let inGroupCounter = 0 // Счетчик пользователей из внешнего списка в группе

        for (const user of externalUsers) {
            counter++
            const userInfo = `${counter}. username: N/A\nid: ${user.user_id}\nfirstname: ${user.fio.split(' ')[0]}\nlastname: ${user.fio.split(' ')[1]}\nbot: N/A\nlang: N/A\n---\n`
            outputMessage += userInfo

            // Логика для проверки, является ли этот пользователь участником группы в Telegram
            if (await isMemberOfGroup(ctx.telegram, chatId, user.user_id)) {
                outputMessage += `Этот участник есть в вашем внешнем списке.\n---\n`
                inGroupCounter++
            }

            if (counter % 10 === 0) {
                await ctx.telegram.sendMessage(LOG_CHANNEL_ID, outputMessage)
                outputMessage = ''
            }
        }

        outputMessage += `Всего пользователей в чате: ${counter}\n`
        outputMessage += `Всего пользователей из внешнего списка в чате: ${inGroupCounter}\n`

        if (outputMessage) {
            await ctx.telegram.sendMessage(LOG_CHANNEL_ID, outputMessage)
        }

    } catch (e) {
        console.error(e)
        await ctx.reply('Ошибка при получении данных о группе.')
    }
})


// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {

    await handleTextCommand(ctx)
    // await handleAddComment(ctx)
})

// Запуск бота
bot.launch()
    .catch((err) => {
        console.error('Fatal Error! Error while launching the bot:', err)
    })

// Инициализация cron-заданий
initCronJobs()
