```mermaid
graph TD
graph TD
    bot --> cron
    bot --> reg
    bot --> text
    bot --> help
    bot --> oplata
    bot --> notify
    bot --> admin

    cron --> notify[notifyAllUsers]
    cron --> oplata[oplataNotification]

    reg --> admin[sendToLog]

    text --> helpers[fetchData]
    text --> notify[notifyUsers]
    text --> comment[handleAddComment]
    text --> admin[sendToLog]

    help --> admin[sendToLog]

    notify --> helpers[fetchData]
    notify --> comment[fetchComments]
    notify --> admin[sendToLog]

    admin --> handleStatusCommand[handleStatusCommand]
    admin --> handleMsgCommand[handleMsgCommand]
```