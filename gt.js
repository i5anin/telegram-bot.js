require('dotenv').config()
const { Telegraf } = require('telegraf')
const axios = require('axios')
const { BOT_TOKEN_ORIG } = process.env
const bot = new Telegraf(BOT_TOKEN_ORIG)

const groupId1 = '-1001967174143'
const groupId2 = '-1001880477192'

const fetchAdmins = async (groupId) => {
    try {
        return await bot.telegram.getChatAdministrators(groupId)
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
        return response.data.users_data
    } catch (error) {
        console.error(`Не удалось получить пользователей: ${error}`)
        return []
    }
}

const compareGroups = async () => {
    const [adminsGroup1, adminsGroup2, usersData] = await Promise.all([
        fetchAdmins(groupId1),
        fetchAdmins(groupId2),
        fetchUsers(),
    ])

    for (const userData of usersData) {
        const userId = userData.user_id.toString()
        const fio = userData.fio

        console.log('-----')
        console.log(`id ${userId}`)
        console.log(`fio ${fio}`)

        const admin1 = adminsGroup1.find(
            (admin) => admin.user.id.toString() === userId
        )
        const admin2 = adminsGroup2.find(
            (admin) => admin.user.id.toString() === userId
        )

        const label1 = admin1 ? admin1.custom_title : 'Нет метки'
        const label2 = admin2 ? admin2.custom_title : 'Нет метки'

        if (admin1) {
            console.log(`1 группа кастомная метка  ${label1}`)
        } else {
            console.log('отсутствует в группе 1')
        }

        if (admin2) {
            console.log(`2 группа кастомная метка  ${label2}`)
        } else {
            console.log('отсутствует в группе 2')
        }

        if (
            (admin1 || admin2) &&
            label1 === 'Нет метки' &&
            label2 === 'Нет метки'
        ) {
            console.log('WARNING: есть в базе но нет кастомной метки')
        }
    }
}

compareGroups().catch((err) => console.error(err))
