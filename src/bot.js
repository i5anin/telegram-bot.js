require('dotenv').config()  // Загрузка переменных среды из .env файла
const { Telegraf } = require('telegraf')

const initCronJobs = require('#src/modules/cron')  // Планировщик задач (cron jobs)
const { handleTextCommand } = require('#src/modules/text')  // Обработка текстовых сообщений
const { handleRegComment } = require('#src/modules/reg')  // Обработка команды регистрации
const { notifyUsers } = require('#src/modules/notify')  // Уведомления пользователя
const { handleAddComment } = require('#src/modules/comment')  // Добавление комментариев
const { handleHelpCommand } = require('#src/modules/help') // Добавление лога

const { handleStatusCommand } = require('#src/utils/log') // Добавление лога

const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())


// Загрузка конфигурационных переменных из .env файла
const { BOT_TOKEN } = process.env

// Инициализация Telegraf бота
const bot = new Telegraf(BOT_TOKEN)

bot.use((ctx, next) => {
    ctx.session = ctx.session || { //  найти ||(или) добавить
        counter: 0,
        isAwaitFio: false,
        isAwaitComment: false,
        userInitiated: false
    }
    return next()
})

// Создание хранилища состояний для пользователей
// const userStates = new Map()

// Установка глобальных переменных
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

// Обработка команды /reg
bot.command('reg', async (ctx) => {
    const chatId = ctx.chat.id

    // Установка начального состояния для пользователя
    // userStates.set(chatId, {
    //     isAwaitFio: false,
    //     isAwaitComment: false,
    //     userInitiated: false,
    // })

    // Попытка обработать команду регистрации
    // try {
    //     await handleRegComment(ctx, userStates.get(chatId).isAwaitFio = true)
    // } catch (error) {
    //     console.error('Error in handleRegComment:', error)
    // }
})

function initializeUserState(ctx) {
    const chatId = ctx.chat.id
    return userStates.get(chatId) || { isAwaitFio: false, isAwaitComment: false, userInitiated: false }
}

function handleCommand(ctx, userStates, handler) {
    const chatId = ctx.chat.id
    const userState = userStates.get(chatId) || { isAwaitFio: false, isAwaitComment: false, userInitiated: false }
    handler(ctx, userState)
    userStates.set(chatId, userState)
}


// Номер экземпляра
const instanceNumber = Math.floor(Math.random() * 100) + 1

// Обработчики команд
bot.command('help', handleHelpCommand)

bot.command(['start', 'reg'],async (ctx) => {
    const chatId = ctx.chat.id;
    const userState = userStates.get(chatId) || initializeUserState(ctx);
    userState.isAwaitFio = true;  // Установка флага
    userStates.set(chatId, userState);  // Обновление состояния
    await handleRegComment(ctx, userState);  // Теперь передаем уже существующий объект состояния
});

bot.command('new_comment', (ctx) => handleCommand(ctx, notifyUsers))

bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber))


// Обработчик текста
bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
});


// Запуск бота
bot.launch().catch((err) => {
    console.error('Error while launching the bot:', err)
})

// Инициализация заданий планировщика (cron jobs)
initCronJobs()

