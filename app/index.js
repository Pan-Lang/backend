const express = require('express')
const MongoClient = require('mongodb').MongoClient
const app = express()
const port = process.env.PORT||3000



const uri = "mongodb+srv://QwertycowMoo:2Deb9281a1asdf@panlang-cluster.ipmwv.mongodb.net/mckinley-foundation?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true })

async function getStockCollection() {
  await client.connect()
  const coll = client.db("mckinley-foundation").collection("stock")
  return coll
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

app.put('/stock', (req, res) => {
  getPeopleCollection().find().then(result => {
    console.log(result)
  })
})

app.get('/stock', (req, res) => {
  getStockCollection().then(result => {
    console.log(result)
  })
})