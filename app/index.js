const express = require('express')
const MongoClient = require('mongodb').MongoClient
const app = express()
const port = process.env.PORT||3000
const router = express.Router();


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

// *********** Person Endpoints *********** //

// Gets all of the person records
app.get('/person', (req, res) => {
  // code here
})

// Creates a new person record in the format of our JSON schema
app.post('/person', (req, res) => {
  // code here
})


// *********** Stock Endpoints *********** //

// Updates the amount of stock 
// Request body example: { "newCount" : 12}
app.put('/stock', (req, res) => {
  getPeopleCollection().find().then(result => {
    console.log(result)
  })
})

// Gets all of the stock as a JSON object
app.get('/stock', (req, res) => {
  getStockCollection().then(result => {
    console.log(result)
  })
})

// Creates a new stock item
// Request body example : {"name" : "Lays potato chips", "count" : 20}
app.post('/stock', (req, res) => {
  // code here
})
