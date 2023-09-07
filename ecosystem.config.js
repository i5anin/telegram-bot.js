module.exports = {
  apps: [
    {
      name: 'my-bot', // Уникальное имя для бота
      script: 'bot.js',
      env: {
        NODE_ENV: 'development',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
