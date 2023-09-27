const ruLang = require('#src/utils/ru_lang')

const { handleAddComment } = require('#src/modules/comment')
const { notifyUsers } = require('#src/modules/notify')
const { sendToLog } = require('#src/utils/log')
const { addUser } = require('#src/api/index')

async function handleTextCommand(ctx) {
    console.log('handleTextCommand', ctx.message.text); // Добавьте эту строку
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    // Деструктуризация полей из сообщения
    const { text, chat, from } = ctx.message

    // Ранний выход для улучшения читаемости
    if (!ctx.session.isAwaitFio && !ctx.session.isAwaitComment && !ctx.message.reply_to_message) return

    // --------- Обработка ожидания ФИО ---------
    if (ctx.session.isAwaitFio && ctx.chat.type === 'private') {
        console.log('ctx.session.isAwaitFio=', ctx.session.isAwaitFio)
        if (!/^[А-Яа-яёЁëË]+\s[А-Яа-яёЁëË]\. ?[А-Яа-яёЁëË]\.$/.test(text)) { //налог с диакритическим знаком "ë"
            ctx.reply(ruLang.invalidData)
            return
        }
        // Дальнейшая логика обработки ФИО
        const cleanedText = text.replace(/ë/g, 'ё').replace(/Ë/g, 'Ё').replace(/\. /g, '.')
        const userId = chat.id

        // Запрос на добавление пользователя
        const dataAddUser = await addUser(userId, cleanedText, from.username)
        ctx.reply('Вы успешно зарегистрированы', { parse_mode: 'HTML' })
        const defMsg = `\nID: <code>${userId}</code>` +
            `\nfio: <code>${cleanedText}</code>`

        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID, dataAddUser ? `${emoji.star}Пользователь добавлен.${defMsg}` : `⚠️Ошибка регистрации${defMsg}`,
            { parse_mode: 'HTML' },
        )

        await notifyUsers(ctx)
        ctx.session.isAwaitFio = false
    }

    // --------- Обработка ожидания комментария ---------
    if (ctx.message.reply_to_message) {
        await handleAddComment(ctx)
        console.log('Обработка ожидания комментария handleAddComment')
    }

    console.log("ctx.session.fileId = ",ctx.session.fileId)

    if (ctx.session.fileId) {
        console.log('Handling message with fileId:', ctx.session.fileId);
        const caption = ctx.message.text;
        const timestamp = Date.now();
        const photoFilename = `${timestamp}.jpg`;
        const textFilename = `${timestamp}.txt`;

        const photoPath = path.join(__dirname, 'photos', photoFilename);
        const textPath = path.join(__dirname, 'texts', textFilename);

        // Сохранение фото
        const fileStream = await ctx.telegram.getFileLink(ctx.session.fileId);
        const writeStream = fs.createWriteStream(photoPath);

        // Дождитесь завершения сохранения фото
        await new Promise((resolve, reject) => {
            fileStream.pipe(writeStream).on('finish', resolve).on('error', reject);
        });

        // Сохранение подписи и идентификатора файла
        const commentData = {
            fileId: ctx.session.fileId,
            caption: caption
        };
        fs.writeFileSync(textPath, JSON.stringify(commentData));

        // Сброс значения fileId
        delete ctx.session.fileId;

        ctx.reply('Фото и подпись сохранены!');
    }
}

module.exports = { handleTextCommand }

