const { getAllUsers, getChatInfo, getChatAdministrators, getChatMembersCount } = require('#src/api/index')
const msg = require('#src/utils/ru_lang')
const { logMessage } = require('#src/utils/ru_lang')



const handleForwardedMessage = async (ctx) => {
    if (!ctx.message.forward_from) return

    const res = ctx.message
    const userId = res.forward_from.id
    const username = res.forward_from.username
    const firstName = res.forward_from.first_name
    const lastName = res.forward_from.last_name

    try {
        const usersData = await getAllUsers()
        const user = usersData.find(u => u.user_id === userId)

        if (user) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim()
            await ctx.reply(`<b>Пользователь</b>\n` + logMessage(userId, user.fio, username, fullName), { parse_mode: 'HTML' })
        } else {
            await ctx.reply(msg.userNotFound(userId), { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error(msg.errorAPI, error)
        await ctx.reply(msg.error)
    }
}


async function whoCommand(ctx) {
    let targetId = ctx.message.text.split(' ')[1] ? parseInt(ctx.message.text.split(' ')[1]) : ctx.from.id;

    const chatInfo = await getChatInfo(targetId);

    switch (chatInfo.type) {
        case 'private':
            if (targetId > 0) {
                // Проверяем пользователя
                const usersData = await getAllUsers();
                const user = usersData.find(u => u.user_id === targetId);

                if (user) {
                    await ctx.reply(`<b>Пользователь</b>\n` + logMessage(targetId, user.fio), { parse_mode: 'HTML' });
                } else {
                    await ctx.reply(msg.userNotFound(targetId), { parse_mode: 'HTML' });
                }
            } else {
                await ctx.reply('Это приватный чат, информация недоступна.');
            }
            break;

        case 'channel':
            await ctx.reply(`Название канала: <code>${chatInfo.title}</code>\nОписание: ${chatInfo.description}`, { parse_mode: 'HTML' });
            break;

        case 'group':
        case 'supergroup':
            let membersCount;
            try {
                membersCount = await getChatMembersCount(targetId);
            } catch (error) {
                membersCount = 'Неизвестно';
            }

            let replyMessage = `Название группы: <code>${chatInfo.title}</code>\nКоличество участников: <code>${membersCount}</code>\n`;

            try {
                const administrators = await getChatAdministrators(targetId);
                const adminNames = administrators.map(admin =>
                    `· ${admin.user.first_name}${admin.user.last_name ? ' ' + admin.user.last_name : ''} (<code>${admin.user.id}</code>)\n`
                ).join('');

                replyMessage += `Админы:\n${adminNames}`;
            } catch (err) {
                replyMessage += 'Не удалось получить список администраторов.';
            }

            await ctx.reply(replyMessage, { parse_mode: 'HTML' });
            break;

        default:
            await ctx.reply('Неизвестный тип чата.');
    }
}



module.exports = { handleForwardedMessage, whoCommand }