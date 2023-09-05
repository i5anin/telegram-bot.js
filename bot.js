require('dotenv').config();
const express = require('express');
const {Telegraf} = require('telegraf');
const axios = require('axios');
const ruLang = require('./ru_lang');
const cron = require('node-cron');

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "-1001946496691"; // ID log канала

const app = express();  // создаем экземпляр Express

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

// Middleware для чтения заголовков
app.use((req, res, next) => {
    const token = req.headers['x-telegram-bot-api-secret-token'];
    if (token) {
        console.log(`Token received: ${token}`);
    }
    next();
});

// Настройка веб-хука
bot.telegram.setWebhook('https://pfforum-js.onrender.com');

// ! ------------ Флаги ------------
let isAwaitFio = false;
let isAwaitComment = false;
let userInitiated = false;
// ! -------------------------------

let currentTaskId = null; // Эта переменная может хранить ID текущей задачи для комментария

// Функция для уведомления всех пользователей
async function notifyAllUsers() {
    const allComments = await fetchComments();
    const data = await fetchData(WEB_SERVICE_URL + "/get_user_id.php");

    if (!data || !data.hasOwnProperty("user_ids")) {
        console.error("The server response did not contain 'user_ids'");
        return;
    }

    const allUsers = data.user_ids;

    for (const chatId of allUsers) {
        // Проверяем, ожидаем ли мы комментарий от этого пользователя
        if (userStates.get(chatId)) {
            continue;
        }

        const userComments = allComments.filter(comment => comment.user_id === chatId);

        if (userComments.length > 0) {
            const comment = userComments[0];
            let message = "<code>Cron</code>\nВам нужно прокомментировать следующую задачу:\n"
                + `<code>(1/${userActualComments.length})</code>\n`
                + `Название: <code>${comment.name}</code>\n`
                + `Обозначение: <code>${comment.description}</code>\n`
                + `Дата: <code>${comment.date}</code>\n`
                + `ID: <code>${comment.id_task}</code>`;

            await bot.telegram.sendMessage(chatId, message, {parse_mode: "HTML"});

            // Устанавливаем состояние ожидания для пользователя
            userStates.set(chatId, {isAwaitingComment: true, taskId: comment.id_task});
        }
    }
    isAwaitComment = true;
}


// Функция для выполнения GET-запросов
async function fetchData(url, params) {
    try {
        const response = await axios.get(url, {params});
        if (!response.data) {
            console.error("Сервер ответил без данных.");
            return null;
        }
        return response.data;
    } catch (error) {
        console.error(ruLang.serverError, error);
        return null;
    }
}


// Проверка комминтариев
async function fetchComments() {
    try {
        // Получение данных от сервера
        const response = await axios.get(WEB_SERVICE_URL + `/get_sk_comments.php`);

        // Добавленная строка для отладки: выводим данные, возвращённые сервером
        // console.log("Данные, возвращаемые с сервера: ", response.data);

        // Проверка наличия поля 'comments' в ответе от сервера
        if (response.data && 'comments' in response.data) {
            return response.data.comments;
        } else {
            console.warn("The field 'comments' was not found in the returned data.");
            return null;
        }
    } catch (error) {
        // В случае ошибки выводим её в консоль
        console.error('Ошибка при получении комментариев:', error);
        return null;
    }
}

// Функция для уведомления пользователей о комментариях
async function notifyUsers(ctx, userInitiated = false) {
    const chatId = ctx.message.chat.id;

    // Переместим эту строку ближе к месту использования
    let currentTaskId = null; // Эта переменная может хранить ID текущей задачи для комментария

    try {
        const uncommentedTasks = await fetchComments();
        if (!uncommentedTasks) {
            return bot.telegram.sendMessage(chatId, "Произошла ошибка при получении комментариев.", {parse_mode: "HTML"});
        }

        const userActualComments = uncommentedTasks.filter(({user_id}) => user_id === chatId);

        console.log(chatId);

        if (userActualComments.length === 0) {
            // if (userInitiated) {
            return bot.telegram.sendMessage(chatId, "Пустые комментарии не найдены.", {parse_mode: "HTML"});
            // }
            return;
        }

        // Установим currentTaskId теперь, когда мы уверены, что он нужен
        currentTaskId = userActualComments[0].id_task;

        // Готовим и отправляем сообщение
        const message = `Пожалуйста, прокомментируйте следующую операцию:\n`
            + `<code>(1/${userActualComments.length})</code>\n`
            + `Название: <code>${userActualComments[0].name}</code>\n`
            + `Обозначение: <code>${userActualComments[0].description}</code>\n`
            + `Дата: <code>${userActualComments[0].date}</code>\n`
            + `id: <code>${currentTaskId}</code>`;

        await bot.telegram.sendMessage(chatId, message, {parse_mode: "HTML"});
    } catch (error) {
        console.error('Error in notifyUsers:', error);
    }
}


// Функция для проверки регистрации пользователя на Сервере
async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php');
    // Добавляем отладочный вывод
    // console.log("Data returned from server: ", data); //  пользователи с сервера
    // Проверяем, содержит ли 'data' нужное поле
    if (data && data.hasOwnProperty('user_ids')) {
        return data.user_ids.includes(chatId);
    } else {
        console.error("The server response did not contain 'user_ids'");
        return false;
    }
}


// Функция для добавления комментария в базу MySQL
async function handleAddComment(ctx) {
    if (!ctx) {
        console.log("Context is undefined!");
        return;
    }

    const chatId = ctx.message.chat.id;
    const userState = userStates.get(chatId);

    if (userState && userState.isAwaitingComment) {
        const userComment = ctx.message.text;

        try {
            await fetchData(WEB_SERVICE_URL + `/update_comment.php`, {id_task: userState.taskId, comment: userComment});
            await bot.telegram.sendMessage(chatId, "Комментарий добавлен успешно.", {parse_mode: "HTML"});
            console.log("Комментарий добавлен успешно.");

            // Обновляем состояние пользователя
            userStates.set(chatId, {isAwaitingComment: false, taskId: null});
        } catch (error) {
            await bot.telegram.sendMessage(chatId, "Ошибка при добавлении комментария: " + error, {parse_mode: "HTML"});
            console.log("Ошибка при добавлении комментария:", error);

            // Обновляем состояние пользователя
            userStates.set(chatId, {isAwaitingComment: true, taskId: userState.taskId});
        }
    } else {
        console.log("No comment is awaited from this user at the moment.");
    }
}


// ! reg
async function handleRegComment(ctx) {
    const chatId = ctx.message.chat.id;
    const isRegistered = await checkRegistration(chatId);

    const { chat, from, text } = ctx.message;
    await bot.telegram.sendMessage(LOG_CHANNEL_ID, `msg ID <code>${chat.id}</code> @${from.username}\nname: <code>${from.first_name || "N/A"}</code>\nSent command: <code>${text}</code>`, {parse_mode: "HTML"});

    if (isRegistered) {
        ctx.reply(ruLang.alreadyRegistered, {parse_mode: 'HTML'});
        isAwaitFio = false;
    } else {
        ctx.reply(ruLang.notRegistered, {parse_mode: 'HTML'});
        isAwaitFio = true;
    }
}


// Обработка текстовых команд ФИО /add_user
async function handleTextCommand(ctx) {
    // console.log('isAwaitFio = ' + isAwaitFio);
    // console.log('isAwaitComment = ' + isAwaitComment);
    const {text, chat, from} = ctx.message
    await bot.telegram.sendMessage(
        LOG_CHANNEL_ID,
        `ID <code>${chat.id}</code>`
        + ` @${from.username}`
        + `\nname: <code>${from.first_name || 'N/A'}</code>`
        + `\nmsg: <code>${text}</code>`,
        {parse_mode: "HTML"}
    );

    if (isAwaitFio) {
        if (/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\. ?[А-Яа-яёЁ]\.$/.test(text)) {
            const cleanedText = text.replace(/\. /g, '.');  // Удаляем пробелы после точек
            const data = await fetchData(WEB_SERVICE_URL + '/add_user.php', {
                id: chat.id, fio: cleanedText, username: from.username, active: 1,
            });
            console.log("Data from fetchData: ", data);
            if (data) {
                // Тут вы можете обработать ответ от сервера.
                // Например, отправить сообщение пользователю.
                ctx.reply("Вы успешно зарегистрированы!", {parse_mode: 'HTML'});
            }
            // console.log("\nЕсли зарегистрировался кидем задачу\n")
            await notifyUsers(ctx); // если зарегистрировался кидем задачу
            isAwaitFio = false;  // Сбрасываем флаг
        } else {
            ctx.reply(ruLang.invalidData)
        }


    } else if (isAwaitComment) {  // Добавленная часть
        // Вызываем уже существующую функцию обработки комментария
        await handleAddComment(ctx);
    }
}

// ! ------------------ command ------------------

bot.command('new_comment', (ctx) => notifyUsers(ctx, true)) // Оповещения с флагом userInitiated=true

bot.command('start', handleRegComment) // start
bot.command('reg', handleRegComment) // reg

bot.on('text', handleTextCommand) // обработка текстовых команд

bot.launch()
    .catch(err => console.error('Error while launching the bot:', err));
const userStates = new Map();
cron.schedule('*/1 * * * *', async () => {
    console.log('Running a task every 10 minutes');
    await notifyAllUsers();
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});





