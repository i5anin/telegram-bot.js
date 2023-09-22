// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const axios = require('axios')

// Импорт модулей
const { initCronJobs } = require('#src/modules/cron')
const { handleRegComment } = require('#src/modules/reg')
const { handleTextCommand } = require('#src/modules/text')
const { handleHelpCommand } = require('#src/modules/help')
const { oplataNotification } = require('#src/modules/oplata')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { logNewChatMembers, logLeftChatMember, sendToLog } = require('#src/utils/log')
const { handleGetGroupInfoCommand } = require('#src/utils/csv')

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
    ctx.session.isUserInitiated = false
}


// Глобальные переменные
global.WEB_API = 'https://bot.pf-forum.ru/api'
global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.SECRET_KEY = process.env.SECRET_KEY
global.DIR_OPLATA = process.env.DIR_OPLATA
global.OPLATA_GROUP = process.env.OPLATA_GROUP
global.OPLATA_REPORT_ACTIVE = process.env.OPLATA_REPORT_ACTIVE //OPLATA_REPORT_ACTIVE = true;
global.MODE = process.env.NODE_ENV || 'development'  // Если NODE_ENV не определен, по умолчанию используется 'development'
global.emoji = {
    x: '&#10060;', ok: '&#9989;',  //❌ //✅
    error: '&#10071;', warning: '&#x26A0;', //❗ //⚠️
    bot: '&#129302;',
}
global.bot = bot
global.stateCounter = {
    bot_update: 0,
    bot_check: 0,

    user_get_all: 0,
    user_get_all_fio: 0,
    user_add: 0,  // user_update: 0,

    comment_get_all: 0,
    comment_update: 0,

    oplata_get_all: 0,
    oplata_update: 0,
}

// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 9000) + 1000
const currentDateTime = new Date()

if (MODE === 'build') {
    const formattedDateTime = `${currentDateTime.getFullYear()}-${String(currentDateTime.getMonth() + 1).padStart(2, '0')}-${String(currentDateTime.getDate()).padStart(2, '0')} ${String(currentDateTime.getHours()).padStart(2, '0')}:${String(currentDateTime.getMinutes()).padStart(2, '0')}:${String(currentDateTime.getSeconds()).padStart(2, '0')}`
// URL для регулярного обновления данных о боте
    const updateBotURL = `${WEB_API}/bot/update.php?key=${SECRET_KEY}&date=${encodeURIComponent(formattedDateTime)}&random_key=${instanceNumber}`

// Отправка данных при запуске бота
    axios.get(updateBotURL)
        .then(response => {
            console.log('Данные о запуске бота успешно зарегистрированы:', response.data)
        })
        .catch(error => {
            console.error('Ошибка регистрации стартовых данных бота:', error)
        })
}

console.log(`! Номер запущенного экземпляра : ${instanceNumber} Время запуска [${currentDateTime}]`)
console.log('OPLATA_REPORT_ACTIVE =', OPLATA_REPORT_ACTIVE)
console.log('MODE =', MODE)

if (MODE === 'build') bot.telegram.sendMessage(LOG_CHANNEL_ID, emoji.bot + `Запуск бота!\nНомер запущенного экземпляра: <code>${instanceNumber}</code>\nВремя запуска: <code>${currentDateTime}</code>`, { parse_mode: 'HTML' })

// Обработчики команд
bot.command(['start', 'reg'], async (ctx) => {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    resetFlags(ctx)
    await handleRegComment(ctx, ctx.session.isAwaitFio = true)
})
bot.command('new_comment', async (ctx) => {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    resetFlags(ctx)
    await notifyUsers(ctx, ctx.session.isUserInitiated = true)
})
bot.command('new_comment_all', async (ctx) => {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    resetFlags(ctx)
    await notifyAllUsers(ctx)
})
bot.command('help', async (ctx) => {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    await handleHelpCommand(ctx)
})
bot.command('oplata', async (ctx) => {
    if (ctx.chat.type !== 'private') return
    await oplataNotification(ctx)
})
bot.command('msg', async (ctx) => {
    if (ctx.chat.type !== 'private') return
    await handleMsgCommand(ctx)
})
bot.command('status', async (ctx) => {
    if (ctx.chat.type !== 'private') return
    await handleStatusCommand(ctx, instanceNumber, currentDateTime)
})
bot.command('get_group_info', async (ctx) => {
    if (ctx.chat.type !== 'private') return
    await handleGetGroupInfoCommand(ctx)
})

bot.command('who', async (ctx) => {
    // if (ctx.chat.type !== 'private') return
    await whoCommand(ctx)
})

bot.on('message', async (ctx) => {
    // Проверка на пересланное сообщение
    if (ctx.message.forward_from) {
        const userId = ctx.message.forward_from.id;
        const username = ctx.message.forward_from.username;
        const firstName = ctx.message.forward_from.first_name;
        const lastName = ctx.message.forward_from.last_name;

        try {
            // Запрос к внешнему API для получения данных о пользователе
            const response = await axios.get(`${WEB_API}/users/get_all_fio.php`);
            const usersData = response.data.users_data;
            const user = usersData.find(u => u.user_id === userId);

            if (user) {
                // Если пользователь найден в данных внешнего API, отправляем информацию о нем
                const fullName = `${firstName || ''} ${lastName || ''}`.trim();
                await ctx.reply(`Пользователь\nID <code>${userId}</code>\nTG: <code>${username || ''}</code> (<code>${fullName}</code>)\nfio: <code>${user.fio}</code>`, { parse_mode: 'HTML' });
            } else {
                // Если пользователь не найден, отправляем сообщение об ошибке
                await ctx.reply(`Пользователь\nID <code>${userId}</code>\nне зарегистрирован в системе`, { parse_mode: 'HTML' });
            }
        } catch (error) {
            console.error('Ошибка при получении данных с внешнего API:', error);
            await ctx.reply('Произошла ошибка при выполнении команды');
        }
    }
});



async function whoCommand(ctx) {
    let userId
    let username
    let firstName
    let lastName


    if (ctx.message.forward_from) {
        console.log(ctx.message.forward_from)
        // Сообщение переслано
        userId = ctx.message.forward_from.id
        username = ctx.message.forward_from.username
        firstName = ctx.message.forward_from.first_name
        lastName = ctx.message.forward_from.last_name
    } else if (ctx.message.reply_to_message) {
        // Ответ на сообщение
        console.log(ctx.message.reply_to_message)
        userId = ctx.message.reply_to_message.from.id
        username = ctx.message.reply_to_message.from.username
        firstName = ctx.message.reply_to_message.from.first_name
        lastName = ctx.message.reply_to_message.from.last_name
    } else {
        // Прямое сообщение
        console.log(input[1] ? parseInt(input[1]) : ctx.from.id)
        const input = ctx.message.text.split(' ')
        userId = input[1] ? parseInt(input[1]) : ctx.from.id
        username = ctx.from.username
        firstName = ctx.from.first_name
        lastName = ctx.from.last_name
    }

    try {
        // Получение данных о пользователях с внешнего API
        const response = await axios.get(`${WEB_API}/users/get_all_fio.php`)

        // Проверка наличия пользователя в полученных данных
        const usersData = response.data.users_data
        const user = usersData.find(u => u.user_id === userId)

        if (user) {
            // Если пользователь найден, отправляем информацию о нем
            const fullName = `${firstName || ''} ${lastName || ''}`.trim()
            await ctx.reply(`Пользователь\nID: <code>${userId}</code>\nTG: <code>${username || ''}</code> (<code>${fullName}</code>)\nfio: <code>${user.fio}</code>`, { parse_mode: 'HTML' })
        } else {
            // Если пользователь не найден, отправляем сообщение об ошибке
            await ctx.reply(`Пользователь\nID: <code>${userId}</code>\nне зарегистрирован в системе`, { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error('Ошибка при получении данных с внешнего API:', error)
        await ctx.reply('Произошла ошибка при выполнении команды')
    }
}




// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    await handleTextCommand(ctx)
})

bot.on('new_chat_members', logNewChatMembers)
bot.on('left_chat_member', logLeftChatMember)

// Запуск бота
bot.launch().catch((err) => {
    console.error('Fatal Error! Error while launching the bot:', err)
    // Перезапуск бота или другие действия по восстановлению
    setTimeout(() => bot.launch(), 30000) // Попробовать перезапустить через 30 секунд
})

// Инициализация cron-заданий
initCronJobs(currentDateTime, instanceNumber)
