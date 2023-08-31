require('dotenv').config();
const {Telegraf} = require('telegraf');
const sqlite3Package = require('sqlite3');
const axios = require('axios');
const {verbose} = sqlite3Package;
const sqlite3 = verbose();
const messages = require('./text_messages');

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

// Функция для выполнения GET-запросов
async function fetchData(url, params) {
    try {
        return axios.get(url, {params}).data
    } catch (error) {
        console.error(messages.serverError, error)
        return null
    }
}

// Проверка комминтариев
async function fetchComments() {
    try {
        const response = await axios.get(
            WEB_SERVICE_URL + '/get_sk_comments.php'
        )
        return response.data.comments
    } catch (error) {
        console.error('Ошибка при получении комментариев:', error)
        return null
    }
}

let isAwaitingComment = false;
let currentTaskId = null; // Эта переменная может хранить ID текущей задачи для комментария

// Функция для уведомления пользователей о комментариях
async function notifyUsers(ctx) {

    const chatId = ctx.message.chat.id;
    const zeroComments = await fetchComments();
    if (!zeroComments) {
        bot.telegram.sendMessage(chatId, "Пустые комментарии не найдены.", {parse_mode: "HTML"});
        return;
    }

    const actualComments = zeroComments.filter(({user_id}) => user_id === chatId); // фильтуем по id нужный
    const arr = actualComments[0]; // предположим, что это ваша текущая задача

    const message =
        'Пожалуйста, прокомментируйте следующую операцию:\n' +
        `<code>(1/${actualComments.length})</code>\n` +
        `Название: <code>${arr.name}</code>\n` +
        `Описание: <code>${arr.description}</code>\n` +
        `Дата: <code>${arr.date}</code>\n` +
        `id: <code>${arr.id_task}</code>`;

    isAwaitComment = true; // Включаем режим ожидания комментария
    currentTaskId = arr.id_task; // Сохраняем ID текущей задачи

    await bot.telegram.sendMessage(chatId, message, {parse_mode: "HTML"})
        .catch(err => console.error("Error sending message to chatId " + chatId, err));
    isAwaitingComment = true;
    async function handleAddComment(ctx) {
        if(!ctx || !ctx.message) {
            // Handle error, maybe log it or send a message to admin
            return;
        }
        const userComment = ctx.message.text;
        // rest of your code
    }

}


// Функция для обработки команды /start
async function handleStartCommand(ctx) {
    // if (isAwaitingComment) {
    //     ctx.reply('Пожалуйста, напишите свой комментарий.') // Отправляем пользователю сообщение, просим его написать комментарий
    //     return
    // }

    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(  // Вы уже зарегистрированы! / Не зарегистрированы
        isRegistered ? messages.alreadyRegistered : messages.notRegistered,
        {parse_mode: 'HTML'}
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
    console.log("Обработка добавления комментария");
    if (isAwaitingComment) {
        const userComment = ctx.message.text;
        const chatId = ctx.message.chat.id;

        // Здесь код для отправки комментария и ID задачи
        try {
            await fetchData(`${WEB_SERVICE_URL}/update_comment.php`, { id: currentTaskId, comment: userComment });
            bot.telegram.sendMessage(chatId, "Комментарий добавлен успешно.", { parse_mode: "HTML" });
            console.log("Комментарий добавлен успешно.");
        } catch (error) {
            bot.telegram.sendMessage(chatId, "Ошибка при добавлении комментария: " + error, { parse_mode: "HTML" });
            console.log("Ошибка при добавлении комментария:", error);
        }

        isAwaitingComment = false; // Сбрасываем флаг ожидания
        currentTaskId = null; // Сбрасываем текущий ID задачи
    } else {
        // Обрабатываем случай, если комментарий не ожидается
    }
}


// ! reg
async function handleRegComment(ctx) {
    ctx.reply(messages.enterData, {parse_mode: 'HTML'})
}

// Функция для обработки текстовых команд
async function handleTextCommand(ctx) {

    if (regChek = 0) {
        console.log(ctx.update.message.reply_to_message)
        const {text, chat, from} = ctx.message
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
}

// ? ------------------ по умолчанию ------------------

// Подключение к базе данных SQLite, сохранение дескриптора в переменную db
let db = new sqlite3.Database('./state.db', (err) => {
    // Проверка на ошибки при подключении
    if (err) {
        // console.error('Could not connect to database', err) // Вывод ошибки, если не удается подключиться
    } else {
        // console.log('Подключение к базе данных') // Вывод сообщения об успешном подключении
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


