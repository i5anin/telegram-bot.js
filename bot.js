require('dotenv').config();
const { Telegraf } = require('telegraf');
const sqlite3Package = require('sqlite3');
const axios = require('axios');
const { verbose } = sqlite3Package;
const sqlite3 = verbose();

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

// Функция для выполнения GET-запросов
async function fetchData(url, params) {
    try {
        return axios.get(url, { params }).data
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


let isAwaitComment = false

// Функция для уведомления пользователей о комментариях
async function notifyUsers(ctx) {
    const chatId = ctx.message.chat.id
    const comments = await fetchComments() // Получаем комментарии с помощью fetchComments
    // Если комментарии не найдены, отправляем сообщение об этом и завершаем выполнение функции
    if (!comments)
        bot.telegram.sendMessage(chatId, 'Комментарии не найдены.', {
            parse_mode: 'HTML',
        })

    const actualComments = comments.filter(({user_id: userId})=> userId === chatId)
    const task = actualComments[0] // Взять первый комментарий из списка

    const message = // Составляем текст сообщения
        `Пожалуйста, прокомментируйте следующую операцию:\n` +
        `<code>(1/${actualComments.length})</code>\n` +
        `Название: <code>${task.name}</code>\n` +
        `Описание: <code>${task.description}</code>\n` +
        `Дата: <code>${task.date}</code>\n` +
        `id: <code>${task.id}</code>`

    const errorMsg = 'Error sending message to chatId'
    isAwaitComment = true
    await bot.telegram // Отправляем сообщение
        .sendMessage(chatId, message, { parse_mode: 'HTML' })
        .catch((err) => console.error(errorMsg + chatId, err))
    let isAwaitComment = true;
}

// Функция для обработки команды /start
async function handleStartCommand(ctx) {
    if (isAwaitComment) {
        ctx.reply('Пожалуйста, напишите свой комментарий.') // Отправляем пользователю сообщение, просим его написать комментарий
        return
    }

    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(  // Вы уже зарегистрированы! / Не зарегистрированы
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        { parse_mode: 'HTML' }
    )
}

// Функция для проверки регистрации пользователя на Сервере
async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php')
    data.user_ids = undefined;
    return data ? data.user_ids.includes(chatId) : false // user_ids проверяем масив
}

// Функция для добавления комментария
// https://bot.pf-forum.ru/web_servise/update_comment.php?id=5&comment=%D0%9D%D0%BE%D0%B2%D1%8B%D0%B9%2020%D0%BA%D0%BE%D0%BC%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D1%80%D0%B8%D0%B9
async function handleAddComment(ctx) {
    // let chatId = ctx.chat.id.toString();

    if (isAwaitComment) {
        // Просто пример функции reply. В реальном коде, она будет работать с библиотекой для чат-бота.
        const reply = new Promise((resolve) => {
            console.log("Пожалуйста, напишите свой комментарий.");
            // Здесь логика для ожидания комментария от пользователя и его получения
            const userComment = "Реальный комментарий пользователя"; // Замените на реальный комментарий
            const userId = ctx.chat.id; // Замените на реальный id
            resolve({ id: userId, comment: userComment });
        });

        reply.then(async ({ id, comment }) => {
            comment = encodeURIComponent(comment);
            const task_id = ctx.someField; // ! Здесь должно быть извлечение нужного ID
            try {
                const url = WEB_SERVICE_URL+`/update_comment.php`;
                const data = await fetchData(url, { id: task_id, comment: comment });
                console.log("Успешно обновлен комментарий:", data);
            } catch (error) {
                console.error("Ошибка при обновлении комментария:", error);
            }
        });
    }
    let isAwaitComment = false;
}



// ! reg
async function handleRegComment(ctx) {
    ctx.reply(messages.enterData, { parse_mode: 'HTML' })
}

// Функция для обработки текстовых команд
async function handleTextCommand(ctx) {
    console.log(ctx.update.message.reply_to_message)
    const { text, chat, from } = ctx.message
    if (/^[А-Яа-я]+\s[А-я]\.[А-я]\.$/.test(text)) {
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

// ? ------------------ по умолчанию ------------------

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

bot.command('new_comment', notifyUsers) // ! Оповещения

bot.command('start', handleStartCommand) // start
bot.command('reg', handleRegComment) // reg

bot.on('text', handleTextCommand) // обработка текстовых команд

bot.launch()


