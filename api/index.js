const { createHash } = require('crypto')
const app = require('express')()
const server = require('http').Server(app)
const { bot } = require('../bot')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')

const jobs = {}
app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: './main' }))
app.set('view engine', '.hbs')
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  res.render('./index.hbs')
})

app.post('/like', async (req, res) => {
  const { usr, pwd, hash } = req.body
  var now = (new Date()).valueOf().toString()
  var random = Math.random().toString()
  const id = createHash('sha1').update(now + random).digest('hex')
  res.end(id)
  jobs[id] = { status: 'loading' }
  const data = bot({
    cred: {
      usr,
      pwd
    },
    search: {
      hash
    },
    like: {
      maxNumberOfFollowers: 1300,
      maxPostsToLikePerUser: 10
    }
  }).then((data) => {
    jobs[id] = data
  }).catch(e => {
    console.log(e);
  })
})

app.get('/results/:id', async (req, res) => {
  if (!jobs[req.params.id]) {
    res.render('./results', { message: '🤖 🤷 nothing to be found' })
    return false
  }
  if (jobs[req.params.id].status === 'loading') {
    res.render('./results', { message: '🤖 still giving out some ♥️' })
    return false
  }
  if (jobs[req.params.id]) {
    res.render('./results', { message: '🤖 has spread some ♥️ for you:', data: JSON.stringify(jobs[req.params.id], null, 4) })
    delete jobs[req.params.id]
    return false
  }
})

module.exports = server
