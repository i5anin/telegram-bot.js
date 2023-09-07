require('dotenv').config()
const express = require('express')
const { Telegraf } = require('telegraf')
const axios = require('axios')
const ruLang = require('./ru_lang')
const cron = require('node-cron')
const io = require('@pm2/io')

io.init({
    transactions: true, // включить отслеживание транзакций
    http: true, // включить метрики веб-сервера (необязательно)
})

// Конфигурационные данные
const WEB_SERVICE_URL = 'https://bot.pf-forum.ru/web_servise'
const BOT_TOKEN = process.env.BOT_TOKEN
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || '-1001946496691' // ID log канала
const HOST_IP = process.env.HOST_IP || 'localhost'
const HOST_PORT = process.env.HOST_PORT || 3000
const GRAND_ADMIN = process.env.GRAND_ADMIN

const app = express()  // создаем экземпляр Express

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN)

// Middleware для чтения заголовков
app.use((req, res, next) => {
    const token = req.headers['x-telegram-bot-api-secret-token']
    if (token) {
        console.log(`Token received: ${token}`)
    }
    next()
})

// Настройка веб-хука
// bot.telegram.setWebhook('https://pfforum-js.onrender.com');

// ! ------------ Флаги ------------
let isAwaitFio = false
let isAwaitComment = false
let userInitiated = false
// ! -------------------------------

// let currentTaskId = null; // Эта переменная может хранить ID текущей задачи для комментария

// Функция для уведомления всех пользователей
async function notifyAllUsers() {
    const allComments = await fetchComments()
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php') // Получить список пользователей /get_user_id.php повторяется

    if (!data || !data.hasOwnProperty('user_ids')) {
        console.error('The server response did not contain \'user_ids\'')
        return
    }

    const allUsers = data.user_ids

    for (const chatId of allUsers) {
        // Проверяем, ожидаем ли мы комментарий от этого пользователя
        if (userStates.get(chatId)) {
            continue
        }

        const userComments = allComments.filter(comment => comment.user_id === chatId)

        if (userComments.length > 0) {
            const comment = userComments[0]
            let message = '<code>Cron</code>\nВам нужно прокомментировать следующую задачу:\n'
                + `<code>(1/${userComments.length})</code>\n`
                + `Название: <code>${comment.name}</code>\n`
                + `Обозначение: <code>${comment.description}</code>\n`
                + `Дата: <code>${comment.date}</code>\n`
                + `ID: <code>${comment.id_task}</code>`

            await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
            counters.cronMessageCounter++ //счётчик cron задач pm2
            // Устанавливаем состояние ожидания для пользователя
            userStates.set(chatId, { isAwaitingComment: true, taskId: comment.id_task })
        }
    }
    isAwaitComment = true
}


// Функция для выполнения GET-запросов
async function fetchData(url, params) {
    try {
        const response = await axios.get(url, { params })
        if (!response.data) {
            console.error('Сервер ответил без данных.')
            return null
        }
        return response.data
    } catch (error) {
        console.error(ruLang.serverError, error)
        return null
    }
}


// Проверка комминтариев
async function fetchComments() {
    try {
        // Получение данных от сервера
        const response = await axios.get(WEB_SERVICE_URL + `/get_sk_comments.php`) //получить список коментариев

        // Добавленная строка для отладки: выводим данные, возвращённые сервером
        // console.log("Данные, возвращаемые с сервера: ", response.data);

        // Проверка наличия поля 'comments' в ответе от сервера
        if (response.data && 'comments' in response.data) {
            return response.data.comments
        } else {
            console.warn('The field \'comments\' was not found in the returned data.')
            return null
        }
    } catch (error) {
        // В случае ошибки выводим её в консоль
        console.error('Ошибка при получении комментариев:', error)
        return null
    }
}

// Функция для уведомления пользователей о комментариях
async function notifyUsers(ctx, userInitiated) {
    const chatId = ctx.message.chat.id

    // Переместим эту строку ближе к месту использования
    let currentTaskId = null // Эта переменная может хранить ID текущей задачи для комментария

    try {
        const uncommentedTasks = await fetchComments()
        if (!uncommentedTasks) {
            return bot.telegram.sendMessage(chatId, 'Произошла ошибка при получении комментариев.', { parse_mode: 'HTML' }) // ! надо поправить если вообще ничего нет
        }

        const userActualComments = uncommentedTasks.filter(({ user_id }) => user_id === chatId)
        if (userActualComments.length === 0) {
            if (userInitiated) {
                return bot.telegram.sendMessage(chatId, 'Пустые комментарии не найдены.', { parse_mode: 'HTML' })
            }
            return
        }

        // Установим currentTaskId теперь, когда мы уверены, что он нужен
        currentTaskId = userActualComments[0].id_task

        // Готовим и отправляем сообщение
        const message = `Пожалуйста, прокомментируйте следующую операцию:\n`
            + `<code>(1/${userActualComments.length})</code>\n`
            + `Название: <code>${userActualComments[0].name}</code>\n`
            + `Обозначение: <code>${userActualComments[0].description}</code>\n`
            + `Дата: <code>${userActualComments[0].date}</code>\n`
            + `id: <code>${currentTaskId}</code>`

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
        counters.messageCounter++ //счётчик сообщений pm2
    } catch (error) {
        console.error('Error in notifyUsers:', error)
    }
}


// Функция для проверки регистрации пользователя на Сервере
async function checkRegistration(chatId) {
    const data = await fetchData(WEB_SERVICE_URL + '/get_user_id.php') // ! Получить список пользоватеолей
    // Добавляем отладочный вывод
    // console.log("Data returned from server: ", data); //  пользователи с сервера
    // Проверяем, содержит ли 'data' нужное поле
    if (data && data.hasOwnProperty('user_ids')) {
        return data.user_ids.includes(chatId)
    } else {
        console.error('The server response did not contain \'user_ids\'')
        return false
    }
}


// Функция для добавления комментария в базу MySQL
async function handleAddComment(ctx) {
    if (!ctx) {
        console.error('Context is undefined!')
        return
    }

    const chatId = ctx.message.chat.id
    const userState = userStates.get(chatId)

    if (userState && userState.isAwaitingComment) {
        const userComment = ctx.message.text

        try {
            await fetchData(WEB_SERVICE_URL + `/update_comment.php`, {
                id_task: userState.taskId,
                comment: userComment,
            }) // ! Обновить комментарий
            await bot.telegram.sendMessage(chatId, 'Комментарий добавлен успешно.', { parse_mode: 'HTML' })
            userStates.set(chatId, { isAwaitingComment: false, taskId: null })  // Обновляем состояние пользователя
        } catch (error) {
            await bot.telegram.sendMessage(chatId, 'Ошибка при добавлении комментария: ' + error, { parse_mode: 'HTML' })
            console.error('Ошибка при добавлении комментария:', error)
            userStates.set(chatId, { isAwaitingComment: true, taskId: userState.taskId })  // Обновляем состояние пользователя
        }
    }
    // else {
    //     console.error("No comment is awaited from this user at the moment.");
    // }
}

let counters = {
    myCounter: 0,
    messageCounter: 0,
    cronMessageCounter: 0,
}

function createMetric(name, counterObject, key) {
    return io.metric({
        name: name,
        value: function() {
            return counterObject[key]
        },
    })
}

const regEvent = createMetric('Reg Event', counters, 'myCounter')
const messageEvent = createMetric('Message Event', counters, 'messageCounter')
const cronMessageEvent = createMetric('Cron Message Event', counters, 'cronMessageCounter')


// ! reg
async function handleRegComment(ctx) {

    const chatId = ctx.message.chat.id
    const isRegistered = await checkRegistration(chatId)

    const { chat, from, text } = ctx.message
    if (chat.id = GRAND_ADMIN) {
        const username = from.username ? '@' + from.username : '<code>N/A</code>'
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `ID <code>${chat.id}</code>`
            + ` username: ${username}`
            + `\nname: <code>${from.first_name || 'N/A'} ${from.last_name || 'N/A'}</code>`
            + `\nmsg: <code>${text}</code>`,
            { parse_mode: 'HTML' },
        )
    }
    if (isRegistered) {
        ctx.reply(ruLang.alreadyRegistered, { parse_mode: 'HTML' })
        isAwaitFio = false
    } else {
        ctx.reply(ruLang.notRegistered, { parse_mode: 'HTML' })
        isAwaitFio = true
    }
}


// Обработка текстовых команд ФИО /add_user
async function handleTextCommand(ctx) {
    // console.log('isAwaitFio = ' + isAwaitFio);
    // console.log('isAwaitComment = ' + isAwaitComment);

    const { text, chat, from } = ctx.message
    if (chat.id = GRAND_ADMIN) {
        const username = from.username ? '@' + from.username : '<code>N/A</code>'
        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID,
            `ID <code>${chat.id}</code>`
            + ` username: ${username}`
            + `\nname: <code>${from.first_name || 'N/A'} ${from.last_name || 'N/A'}</code>`
            + `\nmsg: <code>${text}</code>`,
            { parse_mode: 'HTML' },
        )
    }
    if (isAwaitFio) {
        if (/^[А-Яа-яёЁ]+\s[А-Яа-яёЁ]\. ?[А-Яа-яёЁ]\.$/.test(text)) {
            const cleanedText = text.replace(/\. /g, '.')  // Удаляем пробелы после точек
            const encodedFio = encodeURIComponent(cleanedText)// Процентное кодирование для URL
            const userId = chat.id

            // Запрос на добавление пользователя
            const dataAddUser = await fetchData(WEB_SERVICE_URL + '/add_user.php', {
                id: userId,
                fio: cleanedText,
                username: from.username,
                active: 1,
            })

            // Запрос на добавление пользователя
            const dataRankUp = await fetchData(WEB_SERVICE_URL + '/rank_up.php', { id_user: userId, fio: encodedFio })
            const dataRankUp2 = await fetchData(WEB_SERVICE_URL + '/rank_up2.php', { id_user: userId, fio: encodedFio })

            // Логирование в LOG_CHANNEL_ID для rank_up для add_user
            if (dataRankUp || dataAddUser) {
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `⭐ Пользователь добавлен.`
                    + `\nДобавлена кастомная метка:`
                    + `\nID: <code>${userId}</code>`
                    + `\nfio: <code>${cleanedText}</code>`
                    + `\ndataAddUser: <code>${dataAddUser}</code>`
                    + `\ndataRankUp: <code>${dataRankUp}</code>`
                    + `\ndataRankUp2: <code>${dataRankUp2}</code>`,
                    { parse_mode: 'HTML' },
                )
                counters.myCounter++ //счётчик регистраций pm2

            } else {
                await bot.telegram.sendMessage(
                    LOG_CHANNEL_ID,
                    `⚠️Ошибка регистрации`
                    + `\nID: <code>${userId}</code>`
                    + `\nfio: <code>${cleanedText}</code>`
                    + `\ndataAddUser: <code>${dataAddUser}</code>`
                    + `\ndataRankUp: <code>${dataRankUp}</code>`
                    + `\ndataRankUp2: <code>${dataRankUp2}</code>`,
                    { parse_mode: 'HTML' },
                )
            }

            ctx.reply('Вы успешно зарегистрированы', { parse_mode: 'HTML' })

            await notifyUsers(ctx) // если зарегистрировался кидем задачу
            isAwaitFio = false  // Сбрасываем флаг
        } else {
            ctx.reply(ruLang.invalidData)
        }


    } else if (isAwaitComment) {  // Добавленная часть
        // Вызываем уже существующую функцию обработки комментария
        await handleAddComment(ctx)
    }
}

// ! ------------------ command ------------------

bot.command('new_comment', (ctx) => notifyUsers(ctx, true)) // Оповещения с флагом userInitiated=true
bot.command('start', handleRegComment) // start
bot.command('reg', handleRegComment) // reg

bot.on('text', handleTextCommand) // обработка текстовых команд

// ! ------------------ cron ------------------
bot.launch()
    .catch(err => console.error('Error while launching the bot:', err))
const userStates = new Map()
cron.schedule('*/2 * * * *', async () => {
    // console.log('Running a task every 2 minutes')
    await notifyAllUsers()
})


// ! ------------------ server start ------------------
app.listen(HOST_PORT, HOST_IP, () => {
    console.log(`! Server is running ${HOST_PORT}`)
})







