const axios = require('axios')

const handleForwardedMessage = async (ctx) => {
    if (!ctx.message.forward_from) return

    const userId = ctx.message.forward_from.id
    const username = ctx.message.forward_from.username
    const firstName = ctx.message.forward_from.first_name
    const lastName = ctx.message.forward_from.last_name

    try {
        const response = await axios.get(`${WEB_API}/users/get_all_fio.php`)
        const usersData = response.data.users_data
        const user = usersData.find(u => u.user_id === userId)

        if (user) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim()
            await ctx.reply(`Пользователь\nID <code>${userId}</code>\nTG: <code>${username || ''}</code> (<code>${fullName}</code>)\nfio: <code>${user.fio}</code>`, { parse_mode: 'HTML' })
        } else {
            await ctx.reply(`Пользователь\nID <code>${userId}</code>\nне зарегистрирован в системе`, { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error('Ошибка при получении данных с внешнего API:', error)
        await ctx.reply('Произошла ошибка при выполнении команды')
    }
}


async function whoCommand(ctx) {
    let userId
    let username
    let firstName
    let lastName

    // Инициализация input
    const input = ctx.message.text.split(' ')

    console.log('input[1]=', input[1] ? parseInt(input[1]) : ctx.from.id)
    userId = input[1] ? parseInt(input[1]) : ctx.from.id
    username = ctx.from.username
    firstName = ctx.from.first_name
    lastName = ctx.from.last_name

    try {
        // Получение данных о пользователях с внешнего API
        const response = await axios.get(`${WEB_API}/users/get_all_fio.php`)

        // Проверка наличия пользователя в полученных данных
        const usersData = response.data.users_data
        const user = usersData.find(u => u.user_id === userId)

        if (user) {
            // Если пользователь найден, отправляем информацию о нем
            const fullName = `${firstName || ''} ${lastName || ''}`.trim()
            await ctx.reply(`Пользователь\nID: <code>${userId}</code>\nfio: <code>${user.fio}</code>`, { parse_mode: 'HTML' })
        } else {
            // Если пользователь не найден, отправляем сообщение об ошибке
            await ctx.reply(`Пользователь\nID: <code>${userId}</code>\nне зарегистрирован в системе`, { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error('Ошибка при получении данных с внешнего API:', error)
        await ctx.reply('Произошла ошибка при выполнении команды')
    }
}

module.exports = { handleForwardedMessage, whoCommand }