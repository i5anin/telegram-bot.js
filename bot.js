require('dotenv').config();
const {Telegraf} = require('telegraf');
const axios = require('axios');
const ruLang = require('./ru_lang');

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

// ! ------------ Флаги ------------
let isAwaitFio = false;
let isAwaitComment = false;
// ! -------------------------------

let currentTaskId = null; // Эта переменная может хранить ID текущей задачи для комментария

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
        const response = await axios.get(
            WEB_SERVICE_URL + '/get_sk_comments.php'
        )
        return response.data.comments
    } catch (error) {
        console.error('Ошибка при получении комментариев:', error)
        return null
    }
}

// Функция для уведомления пользователей о комментариях
async function notifyUsers(ctx) {

    const chatId = ctx.message.chat.id;
    const uncommentedTasks = await fetchComments();
    if (!uncommentedTasks) return bot.telegram.sendMessage(chatId, "Пустые комментарии не найдены.", {parse_mode: "HTML"});

    const userActualComments =
        uncommentedTasks.filter(({user_id}) => user_id === chatId); // фильтуем по id нужный
    const currentTask = userActualComments [0]; // берем первую задачу
    isAwaitComment = true; // Включаем режим ожидания комментария
    const message =
        'Пожалуйста, прокомментируйте следующую операцию:\n' +
        `<code>(1/${userActualComments.length})</code>\n` +
        `Название: <code>${currentTask.name}</code>\n` +
        `Описание: <code>${currentTask.description}</code>\n` +
        `Дата: <code>${currentTask.date}</code>\n` +
        `id: <code>${currentTask.id_task}</code>`;

    currentTaskId = currentTask.id_task; // Сохраняем ID текущей задачи

    await bot.telegram.sendMessage(chatId, message, {parse_mode: "HTML"})
        .catch(err => console.error("Error sending message to chatId " + chatId, err));
}



// Функция для проверки регистрации пользователя на Сервере
async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php')
    data.user_ids = undefined;
    return data ? data.user_ids.includes(chatId) : false // user_ids проверяем масив
}

// Функция для добавления комментария в базу MySQL
async function handleAddComment(ctx) {
    console.log("Обработка добавления комментария");
    if (isAwaitComment) {
        const userComment = ctx.message.text;
        const chatId = ctx.message.chat.id;

        // Здесь код для отправки комментария и ID задачи
        try {
            await fetchData(WEB_SERVICE_URL + `/update_comment.php`, {id_task: currentTaskId, comment: userComment});
            bot.telegram.sendMessage(chatId, "Комментарий добавлен успешно.", {parse_mode: "HTML"});
            console.log("Комментарий добавлен успешно.");
        } catch (error) {
            bot.telegram.sendMessage(chatId, "Ошибка при добавлении комментария: " + error, {parse_mode: "HTML"});
            console.log("Ошибка при добавлении комментария:", error);
        }

        isAwaitComment = false; // Сбрасываем флаг ожидания
        currentTaskId = null; // Сбрасываем текущий ID задачи
    } else {
        // Обрабатываем случай, если комментарий не ожидается
    }
}


// ! reg
async function handleRegComment(ctx) {
    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)
    ctx.reply(  // Вы уже зарегистрированы! / Не зарегистрированы
        isRegistered ? ruLang.alreadyRegistered : ruLang.notRegistered,
        {parse_mode: 'HTML'}
        // FIXME: Заменить "Вы уже зарегистрированы!" на выполнение функции проверки комментариев
    )
}

// Обработка текстовых команд ФИО /add_user
async function handleTextCommand(ctx) {

    if (isAwaitFio) {
        const {text, chat, from} = ctx.message
        if (/^[А-Яа-я]+\s[А-я]\.[А-я]\.$/.test(text)) {
            // Проверяет Иванов И.И.
            const data = await fetchData(WEB_SERVICE_URL + '/add_user.php', {
                id: chat.id,
                fio: text,
                username: from.username,
                active: 1,
            })
            console.log("Data from fetchData: ", data);
            if (data) {
                // Тут вы можете обработать ответ от сервера.
                // Например, отправить сообщение пользователю.
                ctx.reply("Вы успешно зарегистрированы!", {parse_mode: 'HTML'});
            }
            isAwaitFio = false;  // Сбрасываем флаг
        } else {
            ctx.reply(ruLang.invalidData)
        }
    }
}

// ! ------------------ command ------------------

bot.command('add_comment', handleAddComment) // ! Добавить комментарий к работе

bot.command('new_comment', notifyUsers) // ! Оповещения

bot.command('start', handleRegComment) // start
bot.command('reg', handleRegComment) // reg

bot.on('text', handleTextCommand) // обработка текстовых команд

bot.launch()


