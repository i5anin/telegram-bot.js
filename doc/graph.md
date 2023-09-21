```mermaid
graph TD
bot --> cron
bot --> reg
bot --> text
bot --> help
bot --> oplata
bot --> notify
bot --> admin

    subgraph bot[bot dependencies]
        bot --> initCronJobs[initCronJobs]
        bot --> handleRegComment[handleRegComment]
        bot --> handleTextCommand[handleTextCommand]
        bot --> handleHelpCommand[handleHelpCommand]
        bot --> oplataNotification[oplataNotification]
        bot --> notifyUsers[notifyUsers]
        bot --> notifyAllUsers[notifyAllUsers]
        bot --> handleStatusCommand[handleStatusCommand]
        bot --> handleMsgCommand[handleMsgCommand]
    end

    subgraph cron[cron dependencies]
        cron --> cronModule["#src/modules/cron"]
    end

    subgraph reg[reg dependencies]
        reg --> regModule["#src/modules/reg"]
    end

    subgraph text[text dependencies]
        text --> textModule["#src/modules/text"]
    end

    subgraph help[help dependencies]
        help --> helpModule["#src/modules/help"]
    end

    subgraph oplata[oplata dependencies]
        oplata --> oplataModule["#src/modules/oplata"]
    end

    subgraph notify[notify dependencies]
        notify --> notifyModule["#src/modules/notify"]
    end

    subgraph admin[admin dependencies]
        admin --> adminUtil["#src/utils/admin"]
    end
```