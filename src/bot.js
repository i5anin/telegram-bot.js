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
const { handleRegComment } = require('#src/modules/reg')
const { handleTextCommand } = require('#src/modules/text')
const { pingService } = require('#src/modules/pingService')
const { handleHelpCommand, handleDocsCommand, handleOperatorCommand } = require('#src/modules/help')
const { oplataNotification } = require('#src/modules/oplata')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { logNewChatMembers, logLeftChatMember } = require('#src/utils/log')
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
// bot.command('metrics_2', (ctx) => metricsNotificationProiz(ctx, 0))
// bot.command('metrics_old', metricsNotification)
bot.command('docs', (ctx) => handleDocsCommand(ctx))
bot.command('oper', (ctx) => handleOperatorCommand(ctx))

bot.command('format', (ctx) => {
    const htmlMessage = `
<b>bold</b>, <strong>bold</strong>
<i>italic</i>, <em>italic</em>
<u>underline</u>, <ins>underline</ins>
<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>
<span class="tg-spoiler">spoiler</span>, <tg-spoiler>spoiler</tg-spoiler>
<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>
<a href="http://www.example.com/">inline URL</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>
<blockquote>Block quotation started\\nBlock quotation continued\\nThe last line of the block quotation</blockquote>
`;

    // Отправка сообщения с HTML форматированием
    ctx.replyWithHTML(htmlMessage, {
        disable_web_page_preview: true // Отключение предпросмотра ссылок
    }).catch(err => console.error(err));
});




// bot.command('ping_test', pingService);


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
