module.exports = [
    {
        "files": ["*.js"],
        "extends": "eslint:recommended"
    },
    {
        "files": ["src/**/*.js"],
        "extends": "eslint-config-airbnb-base",
        "env": {
            "node": true
        }
    }
]