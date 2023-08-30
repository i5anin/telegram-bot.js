require('dotenv').config() // загрузить переменные среды из файла .env
const { Telegraf, Markup, session } = require('telegraf')
const sqlite3 = require('sqlite3').verbose()
const axios = require('axios')

const messages = require('./messages')

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

// Функция для выполнения GET-запросов
async function fetchData(url, params) {
    try {
        return (await axios.get(url, { params })).data
    } catch (error) {
        console.error(messages.serverError, error)
        return null
    }
}

// Функция для выполнения GET-запросов
async function fetchComments() {
    try {
        const response = await axios.get(
            WEB_SERVICE_URL + '/get_sk_comments.php'
        )
        return response.data.comments
    } catch (error) {
        console.error('Error fetching comments:', error)
        return null
    }
}

// Функция для уведомления пользователей о комментариях
async function notifyUsers() {
    const comments = await fetchComments() // Получаем комментарии с помощью fetchComments
    // Если комментарии не найдены, отправляем сообщение об этом и завершаем выполнение функции
    if (!comments)
        bot.telegram.sendMessage(chatId, 'Комментарии не найдены.', {
            parse_mode: 'HTML',
        })
    const firstComment = comments[0] // Взять первый комментарий из списка
    const chatId = firstComment.user_id // Получаем ID чата из первого комментария
    const totalMessagesForUser = comments.filter(
        (c) => c.user_id === chatId
    ).length // Получаем общее число сообщений для этого пользователя

    const message = // Составляем текст сообщения
        `Пожалуйста, прокомментируйте следующую операцию:\n` +
        `<code>(1/${totalMessagesForUser})</code>\n` +
        `Название: <code>${firstComment.name}</code>\n` +
        `Описание: <code>${firstComment.description}</code>\n` +
        `Дата: <code>${firstComment.date}</code>\n` +
        `id: <code>${firstComment.id}</code>`

    const errorMsg = 'Error sending message to chatId'

    await bot.telegram // Отправляем сообщение
        .sendMessage(chatId, message, { parse_mode: 'HTML' })
        .catch((err) => console.error(errorMsg + chatId, err))
}

// Функция для обработки команды /start
async function handleStartCommand(ctx) {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        { parse_mode: 'HTML' }
    )
}

// Функция для проверки регистрации пользователя на Сервере
async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php')
    return data ? data.user_ids.includes(chatId) : false
}

// Функция для отправки нового комментария на Сервер
async function sendNewComment(id, comment) {
    return await fetchData(WEB_SERVICE_URL + '/add_comment.php', {
        id: id,
        comment: comment,
    })
}

// Функция для обновления комментария
async function updateComment(id, newComment) {
    return await fetchData(WEB_SERVICE_URL + '/update_comment.php', {
        id: id,
        comment: newComment,
    })
}

// Функция для добавления комментария
async function handleAddComment(ctx) {
    let chatId = ctx.chat.id.toString() // Преобразуем ID чата в строку
    // Выполняем SQL-запрос для вставки или обновления данных в таблице 'user_session'
    // Мы используем 'INSERT OR REPLACE', чтобы либо вставить новую запись, либо заменить существующую
    db.run(
        `INSERT OR REPLACE INTO user_session (chat_id, state) VALUES (?, ?)`,
        [chatId, 'WAITING_FOR_COMMENT'], // Передаем ID чата и состояние 'WAITING_FOR_COMMENT' как параметры запроса
        (err) => {
            if (err) console.error('Could not insert into table', err) // Обработка ошибок: если произошла ошибка, выводим ее в консоль
        }
    )
    ctx.reply('Пожалуйста, напишите свой комментарий.') // Отправляем пользователю сообщение, просим его написать комментарий
}

// ! reg
async function handleRegComment(ctx) {
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
}

// Функция для обработки текстовых команд
async function handleTextCommand(ctx) {
    const { text, chat, from } = ctx.message
    if (/^[А-Яа-я]+\s[А-Яа-я]\.[А-Яа-я]\.$/.test(text)) {
        // Проверяет Иванов И.И.
        const data = await fetchData(WEB_SERVICE_URL + '/user.php', {
            id: chat.id,
            fio: text,
            username: from.username,
            active: 1,
        })
        if (data) handleApiResponse(ctx, data)
    } else {
        ctx.reply(messages.invalidData)
    }
}

// ? ------------------ по умолчаию ------------------

// Подключение к базе данных SQLite, сохранение дескриптора в переменную db
let db = new sqlite3.Database('./state.db', (err) => {
    // Проверка на ошибки при подключении
    if (err) {
        console.error('Could not connect to database', err) // Вывод ошибки, если не удается подключиться
    } else {
        console.log('Подключение к базе данных') // Вывод сообщения об успешном подключении
    }
})

// ! Создание таблицы 'user_session', если она не существует
db.run(
    'CREATE TABLE IF NOT EXISTS user_session (chat_id TEXT, state TEXT)',
    (err) => {
        // Проверка на ошибки при создании таблицы
        if (err) console.error('Could not create table', err) // Вывод ошибки, если не удается создать таблицу
    }
)

// ! ------------------ command ------------------

bot.command('add_comment', handleAddComment) // ! Добавить комментарий к работе

bot.command('new_comment', notifyUsers) // ! Оповищения

bot.command('start', handleStartCommand) // start
bot.command('reg', handleRegComment) // reg

bot.on('text', handleTextCommand) // обработка текстовых команд

bot.launch()
