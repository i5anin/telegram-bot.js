module.exports = {
    apps: [
      {
        name: 'my-app',
        script: 'app.js',
        env: {
          NODE_ENV: 'development',
        },
        env_development: {
          NODE_ENV: 'development',
        },
      },
    ],
  };
  