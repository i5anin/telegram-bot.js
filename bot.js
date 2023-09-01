require('dotenv').config();
const express = require('express');
const {Telegraf} = require('telegraf');
const axios = require('axios');
const ruLang = require('./ru_lang');
const cron = require('node-cron');

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN
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


async function notifyAllUsers() {
    // Получение всех комментариев
    const allComments = await fetchComments();

    // Получение списка всех зарегистрированных пользователей
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php');
    if (!data || !data.hasOwnProperty('user_ids')) {
        console.error("The server response did not contain 'user_ids'");
        return;
    }
    const allUsers = data.user_ids; // предполагается, что это массив chatId

    allUsers.forEach(async (chatId) => {
        const userComments = allComments.filter(comment => comment.user_id === chatId);

        if (userComments.length > 0) {
            let message = "Вам нужно прокомментировать следующие задачи:\n";
            for (const comment of userComments) {
                const index = userComments.indexOf(comment);
                message += `\n<code>(${index + 1}/${userComments.length})</code>`;
                message += `\nНазвание: <code>${comment.name}</code>`;
                message += `\nОбозначение: <code>${comment.description}</code>`;
                message += `\nДата: <code>${comment.date}</code>`;
                message += `\nID: <code>${comment.id_task}</code>\n`;
            }

            await bot.telegram.sendMessage(chatId, message, {parse_mode: "HTML"});
        } else {
            // await bot.telegram.sendMessage(chatId, "На данный момент у вас нет задач для комментирования.", {parse_mode: "HTML"});
        }
    });
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
        console.log("Данные, возвращаемые с сервера: ", response.data);

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
    console.log("Data returned from server: ", data);
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
    console.log("Context: ", ctx);  // Для отладки
    if (!ctx) {
        console.log("Context is undefined!");
        return;
    }

    if (isAwaitComment) {
        const userComment = ctx.message.text;
        const chatId = ctx.message.chat.id;

        try {
            await fetchData(WEB_SERVICE_URL + `/update_comment.php`, {id_task: currentTaskId, comment: userComment});
            await bot.telegram.sendMessage(chatId, "Комментарий добавлен успешно.", {parse_mode: "HTML"});
            console.log("Комментарий добавлен успешно.");
        } catch (error) {
            await bot.telegram.sendMessage(chatId, "Ошибка при добавлении комментария: " + error, {parse_mode: "HTML"});
            console.log("Ошибка при добавлении комментария:", error);
        }

        isAwaitComment = false;
        currentTaskId = null;
        await notifyUsers(ctx);  // Если функция асинхронная, лучше использовать await
    }
}

// ! reg
async function handleRegComment(ctx) {
    const chatId = ctx.message.chat.id;
    const isRegistered = await checkRegistration(chatId);

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
    console.log('isAwaitFio = ' + isAwaitFio);
    console.log('isAwaitComment = ' + isAwaitComment);
    if (isAwaitFio) {
        const {text, chat, from} = ctx.message
        if (/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\.[А-Яа-яёЁ]\.$/
            .test(text)) {
            // Проверяет Иванов И.И.
            const data = await fetchData(WEB_SERVICE_URL + '/add_user.php', {
                id: chat.id, fio: text, username: from.username, active: 1,
            })
            console.log("Data from fetchData: ", data);
            if (data) {
                // Тут вы можете обработать ответ от сервера.
                // Например, отправить сообщение пользователю.
                ctx.reply("Вы успешно зарегистрированы!", {parse_mode: 'HTML'});
            }
            console.log("\nЕсли зарегистрировался кидем задачу\n")
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

cron.schedule('*/1 * * * *', async () => {
    console.log('Running a task every 10 minutes');
    await notifyAllUsers();
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});





