Вы можете разделить этот код на следующие файлы и определить структуру проекта:

# api.js: Этот файл может содержать основной код для запуска сервера и бота, а также инициализацию различных модулей и middleware.

```javascript
Copy code
// api.js
const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");
const cron = require("node-cron");
const io = require("@pm2/io");
const { initBot } = require("./bot");
const { initServer } = require("./server");

io.init({ transactions: true, http: true });

const app = express();

// ...

const bot = new Telegraf(BOT_TOKEN);

// Initialize bot and server
initBot(bot);
initServer(app, HOST_IP, HOST_PORT);

// ...

// Start bot and server
bot.launch().catch((error) => {
console.error("Error while launching the bot:", error);
});

```

# bot.js: В этом файле можно разместить код, связанный с настройкой и работой Telegram бота.

```javascript
Copy code
// bot.js
const { Telegraf } = require("telegraf");
const axios = require("axios");
const { initCronJobs } = require("./cron");

// Initialize Telegram bot
function initBot(bot) {
// Bot setup, commands, event handlers, and more
// ...

// Initialize cron jobs
initCronJobs(bot);
}

module.exports = { initBot };
server.js: В этом файле можно разместить код, связанный с настройкой и работой веб-сервера Express.
javascript
Copy code
// server.js
const express = require("express");
const { initRoutes } = require("./routes");

// Initialize Express server
function initServer(app, hostIp, hostPort) {
// Server setup, middleware, routes, and more
// ...

// Initialize routes
initRoutes(app);

// Start the Express server
app.listen(hostPort, hostIp, () => {
console.log(`! Server is running ${hostPort}`);
});
}

module.exports = { initServer };
```

# routes.js: В этом файле можно разместить определение и настройку маршрутов Express.

```javascript
Copy code
// routes.js
const { Router } = require("express");

function initRoutes(app) {
const router = Router();

// Define routes and their handlers
// ...

// Use the router for the specified routes
app.use("/", router);
}

module.exports = { initRoutes };
```

# cron.js: В этом файле можно разместить код для управления заданиями cron.

```javascript
Copy code
// cron.js
const cron = require("node-cron");

function initCronJobs(bot) {
// Define and schedule cron jobs
// ...

// Example:
cron.schedule("_/20 _ \* \* \*", async () => {
try {
const message = `Задача выполнена. <code>${new Date().toLocaleTimeString(
        "ru-RU",
        { hour: "2-digit", minute: "2-digit" }
      )}</code>`;
await bot.telegram.sendMessage(LOG_CHANNEL_ID, message, {
parse_mode: "HTML",
});
} catch (error) {
console.error(`Произошла ошибка в крон-задаче: ${error}`);
}
});
}

module.exports = { initCronJobs };
```
