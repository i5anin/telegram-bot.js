require('dotenv').config()
const fs = require('fs')
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

const fetchGroupTitle = async (groupId) => {
    try {
        const chat = await bot.telegram.getChat(groupId)
        return chat.title || 'Неизвестная группа'
    } catch (error) {
        console.error(
            `Не удалось получить название группы ${groupId}: ${error}`
        )
        return 'Неизвестная группа'
    }
}

const excludedUserIds = [
    '465727872', //Роман Гусаров
    '6387629342', // ПФ-Форум bot
]

const checkAdmins = (admins, groupName, userIdsFromApi, logStream) => {
    for (const admin of admins) {
        const userId = admin.user.id.toString()

        // Пропустить, если это бот или пользователь в списке исключений
        if (admin.user.is_bot || excludedUserIds.includes(userId)) {
            continue
        }

        if (!userIdsFromApi.has(userId)) {
            const fio =
                admin.user.first_name + ' ' + (admin.user.last_name || '')
            const customTitle = admin.custom_title
                ? admin.custom_title
                : 'Нет метки'
            const username = admin.user.username
                ? `@${admin.user.username}`
                : 'Нет username'

            console.log('-----')
            console.log(`id ${userId}`)
            console.log(`fio ${fio}`)
            console.log(`username ${username}`)
            const logMessage = `WARNING: админ с меткой "${customTitle}" из группы "${groupName}", но отсутствует в get_all_fio.php`
            console.log(logMessage)
            logStream.write(logMessage + '\n')
            console.log('-----')
        }
    }
}

const compareGroups = async () => {
    const logStream = fs.createWriteStream('group1_log.txt', { flags: 'a' })
    const [adminsGroup1, adminsGroup2, usersData, title1, title2] =
        await Promise.all([
            fetchAdmins(groupId1),
            fetchAdmins(groupId2),
            fetchUsers(),
            fetchGroupTitle(groupId1),
            fetchGroupTitle(groupId2),
        ])

    const userIdsFromApi = new Set(
        usersData
            .map((user) => user.user_id.toString())
            .filter((id) => !excludedUserIds.includes(id))
    )

    // Проверяем админов для каждой группы
    checkAdmins(adminsGroup1, title1, userIdsFromApi, logStream)
    checkAdmins(adminsGroup2, title2, userIdsFromApi, logStream)

    logStream.end()

    for (const admin of [...adminsGroup1, ...adminsGroup2]) {
        const userId = admin.user.id.toString()

        if (!userIdsFromApi.has(userId)) {
            const fio =
                admin.user.first_name + ' ' + (admin.user.last_name || '')
            const customTitle = admin.custom_title
                ? admin.custom_title
                : 'Нет метки'
            const username = admin.user.username
                ? `@${admin.user.username}`
                : 'Нет username'

            console.log('-----')
            console.log(`id ${userId}`)
            console.log(`fio ${fio}`)
            console.log(`username ${username}`)
            console.log(
                `WARNING: админ с меткой "${customTitle}", но отсутствует в get_all_fio.php`
            )
            console.log('-----')
        }
    }

    for (const userData of usersData) {
        const userId = userData.user_id.toString()
        const fio = userData.fio

        const admin1 = adminsGroup1.find(
            (admin) => admin.user.id.toString() === userId
        )
        const admin2 = adminsGroup2.find(
            (admin) => admin.user.id.toString() === userId
        )

        const label1 = admin1 ? admin1.custom_title : 'Нет метки'
        const label2 = admin2 ? admin2.custom_title : 'Нет метки'

        // Если пользователь есть в обеих группах и у него есть кастомные метки в обеих группах, пропускаем его
        if (
            admin1 &&
            admin2 &&
            label1 !== 'Нет метки' &&
            label2 !== 'Нет метки'
        ) {
            continue
        }

        console.log('-----')
        console.log(`id ${userId}`)
        console.log(`fio ${fio}`)

        if (admin1) {
            console.log(`${title1} кастомная метка  ${label1}`)
        } else {
            console.log(`отсутствует в группе ${title1}`)
        }

        if (admin2) {
            console.log(`${title2} кастомная метка  ${label2}`)
        } else {
            console.log(`отсутствует в группе ${title2}`)
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
