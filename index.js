const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded({ extended: false }))

// ponytail: in-memory store, lost on restart; swap for MongoDB if data must persist
const users = []
const exercises = []
const newId = () => require('crypto').randomBytes(12).toString('hex')

// "YYYY-MM-DD" parsed as local midnight, so toDateString() never shifts the day (UTC-3)
const parseDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s)

app.route('/api/users')
  .post((req, res) => {
    const user = { username: req.body.username, _id: newId() }
    users.push(user)
    res.json(user)
  })
  .get((req, res) => res.json(users))

app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(u => u._id === req.params._id)
  if (!user) return res.json({ error: 'user not found' })

  const date = req.body.date ? parseDate(req.body.date) : new Date()
  if (isNaN(date)) return res.json({ error: 'invalid date' })
  const duration = Number(req.body.duration)
  if (!req.body.description || !duration) return res.json({ error: 'description and duration are required' })

  const exercise = { userId: user._id, description: req.body.description, duration, date }
  exercises.push(exercise)
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: date.toDateString(),
    _id: user._id
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(u => u._id === req.params._id)
  if (!user) return res.json({ error: 'user not found' })

  const { from, to, limit } = req.query
  let log = exercises.filter(e => e.userId === user._id)
  if (from) log = log.filter(e => e.date >= parseDate(from))
  if (to) log = log.filter(e => e.date <= parseDate(to))
  if (limit) log = log.slice(0, Number(limit))

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log.map(e => ({ description: e.description, duration: e.duration, date: e.date.toDateString() }))
  })
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
