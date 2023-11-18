const io = require('@pm2/io')


function createMetric(name, counterObject, key) {
    return io.metric({
        name: name,
        value: function() {
            return counterObject[key]
        },
    })
}




module.exports = { createMetric }