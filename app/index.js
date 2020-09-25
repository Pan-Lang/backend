const express = require('express')
const MongoClient = require('mongodb').MongoClient
const {Translate} = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
const cors = require('cors')



const app = express()
app.use(express.json()); // JSON middleware
const port = process.env.PORT||3000

const uri = "mongodb+srv://QwertycowMoo:2Deb9281a1asdf@panlang-cluster.ipmwv.mongodb.net/mckinley-foundation?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true })
const translate = new Translate(); // creates a client


async function getStockCollection() {
  await client.connect()
  const coll = client.db("mckinley-foundation").collection("stock")
  return coll
}

app.use(cors())

app.get('/', (req, res) => {
  translateText()
  res.send("Hello World!")
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

// *********** API Functions *********** //

const text = 'сука блять';
const target = 'eng';

async function translateText() {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  let [translations] = await translate.translate(text, target);
  translations = Array.isArray(translations) ? translations : [translations];
  console.log('Translations:');
  translations.forEach((translation, i) => {
    console.log(`${text[i]} => (${target}) ${translation}`);
  });
}



// *********** Person Endpoints *********** //

// Gets all of the person records
// Probably returns them back as a formatted text file at a button press
app.get('/person', (req, res) => {
  // code here
})

// Creates a new person record in the format of our JSON schema
app.post('/person', async (req, res) => {
  // code here
  // console.log(req.body)
  // console.log(req.body.zipcode)

  // let result = await getStockCollection();
  // result.forEach(entry => {
  //   console.log(entry)
  // })
  // console.log(x);

  await client.connect()
  const coll = client.db("mckinley-foundation").collection("person")
  await coll.insertOne(req.body);
  coll.find().forEach(({firstname, lastname}) => { // object destructuring happening in the args
    console.log(`${firstname} has a lastname : ${lastname}`) // template strings
  })

  // coll.find().forEach((person) => {



  // })
  // coll.find().forEach(function hello(person)  {

  // });

  res.send(200); // our response
})


// *********** Stock Endpoints *********** //

// Updates the amount of stock 
// Request body example: { "newCount" : 12}
app.put('/stock', (req, res) => {
  getPeopleCollection().then(result => {
    req.body
  })
})

// Gets all of the stock as a JSON object
app.get('/stock', (req, res) => {
  getStockCollection().then(coll => {
    findResult = coll.find()
    let r = []
    findResult.forEach(function(doc) {
      r.push(doc)
    }).then(function() {
      res.jsonp(r)
    })
    })
    
})


// Creates a new stock item
// Request body example : {"name" : "Lays potato chips", "count" : 20}
app.post('/stock', (req, res) => {
  const jsonBody = {"name" : "Lays potato chips", "count" : 20, "timestamp" : new Date()}//req.body

  getStockCollection().then(coll => [
    coll.insertOne(jsonBody).then(collReturn => {
      console.log(collReturn)
      console.log(collReturn.insertedId)
      console.log(new Date())
    })
  ])
})
