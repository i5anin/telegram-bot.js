// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const io = require('@pm2/io')

// включить отслеживание транзакций
// включить метрики веб-сервера (необязательно)
io.init({ transactions: true, http: true })

// Импорт модулей
const { initCronJobs } = require('#src/modules/cron')
const { handleRegComment, checkRegistration } = require('#src/modules/reg')
const { handleTextCommand } = require('#src/modules/text')
const { handleHelpCommand, handleDocsCommand, handleOperatorCommand } = require('#src/modules/help')
const { oplataNotification } = require('#src/modules/oplata')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { logNewChatMembers, logLeftChatMember, sendToLog } = require('#src/utils/log')
const { handleGetGroupInfoCommand } = require('#src/utils/csv')
const { runBot } = require('#src/modules/runBot')
const { handleForwardedMessage, whoCommand } = require('#src/modules/who')
const { createMetric } = require('#src/utils/metricPM2')
const {
    metricsNotificationDirector,
    formatMetricsMessageMaster,
    sendMetricsMessagesNach,
} = require('#src/modules/metrics')
const { handlePhoto } = require('#src/modules/photo')

// Конфигурационные переменные
const { BOT_TOKEN } = process.env

// Инициализация Telegraf бота
const bot = new Telegraf(BOT_TOKEN)

// Инициализация сессии
const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())

// Сессионный middleware
bot.use((ctx, next) => {
    ctx.session = ctx.session || { isAwaitFio: false, isAwaitComment: false, isUserInitiated: false }
    return next()
})


// Глобальные переменные
global.SECRET_KEY = process.env.SECRET_KEY
global.WEB_API = process.env.WEB_API

global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID

global.DIR_OPLATA = process.env.DIR_OPLATA
global.DIR_METRIC = process.env.DIR_METRIC
global.KISELEV = process.env.KISELEV

global.DIR_TEST_GROUP = process.env.DIR_TEST_GROUP
global.ADMIN_DB = process.env.ADMIN_DB

global.OPLATA_REPORT_ACTIVE = process.env.OPLATA_REPORT_ACTIVE //OPLATA_REPORT_ACTIVE = true;
global.METRICS_REPORT_ACTIVE = process.env.METRICS_REPORT_ACTIVE //METRICS_REPORT_ACTIVE = true;


global.MODE = process.env.NODE_ENV || 'development'  // Если NODE_ENV не определен, по умолчанию используется 'development'
global.emoji = {
    x: '&#10060;',
    ok: '&#9989;',
    error: '&#10071;',
    warning: '&#x26A0;',
    bot: '&#129302;',
    star: '&#11088;',
    tech: '&#9881;',
    rating_1: '🥇',
    rating_2: '🥈',
    rating_3: '🥉',
    point: '&#183;',
    // point: '&#8226;', // •
    // min_point: '&#183;', // ·
}   //❌ //✅ //❗ //⚠ //🤖 //⭐ //⚙️ // 🥇 // 🥈 // 🥉 // • // ·

global.bot = bot
global.stateCounter = {
    bot_update: 0,
    bot_check: 0,

    user_get_all: 0,
    users_get: 0,
    users_get_all_fio: 0,
    users_add: 0,

    comment_get_all: 0,
    comment_update: 0,

    oplata_get_all: 0,
    oplata_update: 0,

    instanceNumber: 0, //для метрики
}

// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 9000) + 1000
const currentDateTime = new Date()
stateCounter.instanceNumber = instanceNumber //для метрики

bot.use((ctx, next) => {
    if (ctx.message) {
        if (ctx.message.forward_from) {
            handleForwardedMessage(ctx, ctx.message.forward_from.id)  // Если сообщение переслано и sender разрешил связывание
            return
        } else if (ctx.message.forward_sender_name) {
            handleForwardedMessage(ctx, ctx.message.forward_sender_name)  // Если сообщение переслано, но sender запретил связывание
            return
        }
    }
    return next()  // Если сообщение не переслано или не содержит команды, передаем обработку следующему middleware
})


runBot(instanceNumber, currentDateTime)


// Обработчик для фото с подписью
bot.on('photo', (ctx) => handlePhoto(ctx))

// Обработчики команд
bot.command('reg_key', (ctx) => handleRegComment(ctx, ctx.session.isAwaitFio = true)) //['start', 'reg']
bot.command('new_comment', (ctx) => notifyUsers(ctx, ctx.session.isUserInitiated = true))
bot.command('new_comment_all', notifyAllUsers)
bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', handleMsgCommand)
bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber, currentDateTime))
bot.command('get_group_info', (ctx) => handleGetGroupInfoCommand(ctx))
bot.command('who', (ctx) => whoCommand(ctx))
bot.command(['m', 'metrics'], (ctx) => metricsNotificationDirector(ctx, 1))
bot.command('metrics_director_notification', (ctx) => metricsNotificationDirector(ctx, 0))
bot.command('metrics_nachalnic_notification', (ctx) => sendMetricsMessagesNach())
bot.command('metrics_master_notification', (ctx) => formatMetricsMessageMaster())

// ----------------------------------------------------------------
// Функция для отправки блока кнопок
function sendTwoByEightButtons(ctx) {
    // Создание клавиатуры с кнопками, используя актуальные данные
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Отклонение от плана', 'action_1'), Markup.button.callback('', 'action_2')],
        [Markup.button.callback('Производство', 'action_3'), Markup.button.callback('-12%', 'action_4')],
        [Markup.button.callback('Брак', 'action_5'), Markup.button.callback('0%', 'action_6')],
        [Markup.button.callback('Отдел продаж', 'action_7'), Markup.button.callback('318%', 'action_8')],
        [Markup.button.callback('Воронка', 'action_9'), Markup.button.callback('', 'action_10')],
        [Markup.button.callback('Производство', 'action_11'), Markup.button.callback('76%', 'action_12')],
        [Markup.button.callback('Согласование', 'action_13'), Markup.button.callback('94%', 'action_14')],
        [Markup.button.callback('Итого вн. производства', 'action_15'), Markup.button.callback('98%', 'action_16')],
        [Markup.button.callback('Упаковка', 'action_17'), Markup.button.callback('100%', 'action_18')],
        [Markup.button.callback('Продуктивность', 'action_17'), Markup.button.callback('', 'action_18')],
        [Markup.button.callback('Продуктивность', 'action_17'), Markup.button.callback(' 2 809 ₽/час', 'action_18')],
        [Markup.button.callback('Отгрузка М/О', 'action_17'), Markup.button.callback('8 542 849 ₽', 'action_18')],
        [Markup.button.callback('Отгрузка с НДС', 'action_17'), Markup.button.callback('14 533 900 ₽', 'action_18')],
    ]);

    // Отправка сообщения с клавиатурой
    ctx.reply('Незавершённое по М/О: 111 849 201 ₽\n' +
        'Слесарный участок: 8 024 380 ₽\n' +
        'ОТК: 1 593 001 ₽\n' +
        'Упаковка: 289 501 ₽\n' +
        'Доработка ЧПУ: 340 165 ₽\n' +
        'Доработка в слесарном: 198 832 ₽\n' +
        'Согласование: 149 117 ₽\n' +
        '\n' +
        'Итого внутреннего производства: 122 444 197 ₽\n' +
        'Ожидаемая предоплата с НДС: 160 868 286 ₽\n' +
        'Итого внутреннего производства с НДС: 166 161 354 ₽\n' +
        'Готовая продукция на складе с НДС: 24 743 555 ₽', keyboard);
}


// Добавление обработчика команды /btn
bot.command('btn', sendTwoByEightButtons);
// ----------------------------------------------------------------

const { Markup } = require('telegraf');

async function sendTableAsButtons(ctx) {
    // await sendToLog(ctx)
    const chatId = ctx.message.chat.id  // Получение chatId из контекста ctx
    try {
        const registrationData = await checkRegistration(chatId)  // Проверка регистрации
        const isRegistered = registrationData.exists

        if (isRegistered) {  // Если пользователь зарегистрирован
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.url('Общая штатная папка', 'https://drive.google.com/drive/folders/1y5W8bLSrA6uxMKBu_sQtJp7simhDExfW')],
                [Markup.button.url('Должностная папка оператора', 'https://drive.google.com/drive/folders/1ZmouCoENMzQ7RZxhpmAo-NeZmAanto0V')],
                [Markup.button.url('СОФТ (Локально)', 'http://eml.pfforum/')],
                [Markup.button.url('Архив собраний', 'https://disk.yandex.ru/d/ajVEHCmS5s2T2A')],
            ])

            await ctx.reply('Вот несколько полезных ссылок:', keyboard)
        } else {  // Если пользователь не зарегистрирован
            await ctx.reply('Доступ закрыт.\nВы должны зарегистрироваться, чтобы получить доступ к этим ресурсам.')
        }
    } catch (error) {
        console.error('Ошибка при проверке регистрации:', error)
        await ctx.reply('Произошла ошибка при проверке регистрации. Пожалуйста, попробуйте позже.')
    }
}

bot.command('table', (ctx) => sendTableAsButtons())

// bot.command('metrics_2', (ctx) => metricsNotificationProiz(ctx, 0))
// bot.command('metrics_old', metricsNotification)
bot.command('docs', (ctx) => handleDocsCommand(ctx))
bot.command('oper', (ctx) => handleOperatorCommand(ctx))
bot.on('message', (ctx) => handleTextCommand(ctx))
bot.on('text', (ctx) => handleTextCommand(ctx)) // особо не нужна но пусть будет


// Обработчик текстовых сообщений

bot.on('new_chat_members', logNewChatMembers)
bot.on('left_chat_member', logLeftChatMember)

// Запуск бота
bot.launch().catch((err) => {
    console.error('Fatal Error! Error while launching the bot:', err)
    setTimeout(() => bot.launch(), 30000) // Попробовать перезапустить через 30 секунд
})

createMetric('bot_check', stateCounter, 'bot_check')
createMetric('user_get_all', stateCounter, 'user_get_all')
createMetric('users_get_all_fio', stateCounter, 'users_get_all_fio')
createMetric('user_add', stateCounter, 'user_add')
createMetric('users_get', stateCounter, 'users_get')
createMetric('comment_get_all', stateCounter, 'comment_get_all')
createMetric('comment_update', stateCounter, 'comment_update')
createMetric('oplata_get_all', stateCounter, 'oplata_get_all')
createMetric('oplata_update', stateCounter, 'oplata_update')
createMetric('instanceNumber', stateCounter, 'instanceNumber')

// Инициализация cron-заданий
initCronJobs(currentDateTime, instanceNumber)
