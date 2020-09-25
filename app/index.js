const express = require('express')
const app = express()
const port = process.env.PORT||3000

const uri = "mongodb+srv://QwertycowMoo:2Deb9281a1asdf@panlang-cluster.ipmwv.mongodb.net/<dbname>?retryWrites=true&w=majority"
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/help', (req, res, next) => {
  res.send('This is to help you');
})