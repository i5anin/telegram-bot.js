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
    try {
        // Проверяем, является ли отправитель GRAND_ADMIN
        if (ctx.from.id.toString() !== GRAND_ADMIN) {
            return ctx.reply('Только GRAND_ADMIN может использовать данную команду.');
        }

        // Получаем аргументы команды (если есть)
        const input = ctx.message.text.split(' ');
        if (input.length !== 2) {
            return ctx.reply('Использование: /get_group_info [chat_id]');
        }

        const chatId = input[1];

        // Получаем информацию о чате
        const chatInfo = await ctx.telegram.getChat(chatId);

        if (!chatInfo) {
            return ctx.reply('Чат не найден.');
        }

        // Получаем информацию о участниках чата (этот метод может не работать для больших групп)
        // Замените этот код на ваш способ получения информации о пользователях
        const chatMembers = await ctx.telegram.getChatMembersCount(chatId);

        if (!chatMembers) {
            return ctx.reply('Не удается получить информацию о участниках чата.');
        }

        // Здесь можно добавить логику проверки на внешние базы данных или что-то в этом роде

        // Выводим информацию
        let infoText = `Информация о группе ${chatInfo.title}:\n`;
        infoText += `ID группы: ${chatInfo.id}\n`;
        infoText += `Количество участников: ${chatMembers}\n`;
        // Добавьте сюда другую необходимую информацию

        ctx.reply(infoText);
    } catch (error) {
        console.error('Ошибка при получении данных о группе:', error);
        ctx.reply('Ошибка при получении данных о группе.');
    }
});



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
