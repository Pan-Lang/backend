const express = require('express')
const MongoClient = require('mongodb').MongoClient
const cors = require('cors')
const {Translate} = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
const app = express()
app.use(express.json()); // JSON middleware
const port = process.env.PORT||3000

const uri = "mongodb+srv://QwertycowMoo:2Deb9281a1asdf@panlang-cluster.ipmwv.mongodb.net/mckinley-foundation?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true })
const translate = new Translate(); // creates a client

// *********** fastCSV Setup *********** //
const fastcsv = require("fast-csv")
const fs = require("fs")
// const writeStream = fs.createWriteStream("panlang_mongodb_fastcsv.csv")
let url = "mongodb://localhost:27017/people"

async function getStockCollection() {
  await client.connect()
  const coll = client.db("mckinley-foundation").collection("stock")
  return coll
}

app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

// *********** API Functions *********** //

const text = 'сука блять'
const target = 'eng'

async function translateText() {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  let [translations] = await translate.translate(text, target)
  translations = Array.isArray(translations) ? translations : [translations]
  console.log('Translations:')
  translations.forEach((translation, i) => {
    console.log(`${text[i]} => (${target}) ${translation}`)
  });
}

// translateText();

// *********** People Endpoints *********** //

// Gets all of the people records
// Probably returns them back as a formatted text file at a button press
app.get('/people', async (req, res) => {
  if (Object.keys(req.body).length === 0) {

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'download-' + Date.now() + '.csv\"');

    await client.connect()
    const coll = client.db("mckinley-foundation").collection("people")

     MongoClient.connect(
      url, {useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) throw err;

        coll.find({}).toArray((err, data) => {
            if (err) throw err;

            console.log(data)
            fastcsv
              .write(data, {headers: true})
              .on("finish", function() {
                console.log("Write to database was successful.")
              })
              .pipe(res) // this was originally WriteStream




            // client.close();
          });
      }
    );

    // res.sendStatus(200);
  }
})

// Creates a new people record in the format of our JSON schema
app.post('/people', async (req, res) => {
  // code here
  // console.log(req.body)
  // console.log(req.body.zipcode)

  // let result = await getStockCollection();
  // result.forEach(entry => {
  //   console.log(entry)
  // })
  // console.log(x);

  await client.connect()
  const coll = client.db("mckinley-foundation").collection("people")
  await coll.insertOne(req.body);
  res.sendStatus(200); // our response--operation was successful

  // coll.find().forEach(({firstname, lastname, adults, children, zipcode, timestamp, order_notes}) => { // object destructuring happening in the args
  //   console.log(`${firstname} has a lastname : ${lastname} and num adults: ${adults}`) // template strings
  // })



  // coll.find().forEach((people) => {



  // })
  // coll.find().forEach(function hello(people)  {

  // });
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
  const jsonBody = {"name" : "Lays potato chips", "count" : 20}//req.body

  getStockCollection().then(coll => [
    console.log(coll.insertOne(jsonBody))
  ])
})
