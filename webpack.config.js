const path = require('path');

module.exports = {
    entry: './src/bot.js', // ваша входная точка
    output: {
        filename: 'bundle.js', // имя выходного файла
        path: path.resolve(__dirname, 'dist') // папка, куда будет собираться ваш проект
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/') // позволяет использовать @ как короткую ссылку до src
        }
    },
};
