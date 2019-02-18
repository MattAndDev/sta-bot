const api = require('./api')
const port = 3000

// don't die
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err)
})

api.listen(port)
