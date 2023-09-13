require('dotenv').config()

const { Telegraf } = require('telegraf')
const axios = require('axios')
const { BOT_TOKEN_ORIG } = process.env
const bot = new Telegraf(BOT_TOKEN_ORIG)

const groupId1 = '-1001967174143'

const fetchAdmins = async (groupId) => {
    try {
        const admins = await bot.telegram.getChatAdministrators(groupId)
        console.log('Администраторы группы:', admins)
        return admins
    } catch (error) {
        console.error(
            `Не удалось получить список администраторов для группы ${groupId}: ${error}`
        )
        return []
    }
}

const fetchUsers = async () => {
    try {
        const response = await axios.get(
            'https://bot.pf-forum.ru/api/users/get_all_fio.php'
        )
        console.log('Пользователи:', response.data.users_data)
        return response.data.users_data
    } catch (error) {
        console.error(`Не удалось получить пользователей: ${error}`)
    }
}

fetchAdmins(groupId1).catch((err) => console.error(err))
fetchUsers().catch((err) => console.error(err))
