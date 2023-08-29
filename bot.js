const Telegraf = require("telegraf");
const axios = require("axios");

// Инициализация бота с токеном от Telegram
const bot = new Telegraf("YOUR_BOT_TOKEN_HERE");

// Обработчик для команды /weather
bot.command("weather", async (ctx) => {
  // Получаем имя города из сообщения пользователя
  const input = ctx.message.text.split(" ");
  const cityName = input.length > 1 ? input.slice(1).join(" ") : "Moscow";

  try {
    // Получаем погоду с помощью AJAX запроса
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=YOUR_OPENWEATHER_API_KEY_HERE`
    );
    const weatherData = response.data;

    // Формируем и отправляем сообщение
    const weatherInfo = `
      Weather in ${cityName}:
      Temperature: ${(weatherData.main.temp - 273.15).toFixed(2)}°C
      Condition: ${weatherData.weather[0].description}
    `;

    ctx.reply(weatherInfo);
  } catch (error) {
    // Обработка ошибок
    console.error(error);
    ctx.reply("Error fetching weather data.");
  }
});

// Запуск бота
bot.launch();
