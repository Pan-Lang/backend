const express = require('express')
const MongoClient = require('mongodb').MongoClient
const app = express()
const port = process.env.PORT||3000


const uri = "mongodb+srv://QwertycowMoo:2Deb9281a1asdf@panlang-cluster.ipmwv.mongodb.net/<dbname>?retryWrites=true&w=majority"
const client = new MongoClient
async function getPeople() {
  await client.connect()
  const db = client.db("people")
}
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/help', (req, res) => {
  res.send('This is to help you');
})