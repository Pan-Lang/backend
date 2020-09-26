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

// Grabs the records of patrons that visited the foodbank within the period of time specified in the request
// Downloads the data as a CSV file to the user's computer/smartphone
app.get('/people', async (req, res) => {

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'download-' + Date.now() + '.csv\"');

  await client.connect()
  const coll = client.db("mckinley-foundation").collection("people")

  // Grabbing the patron info from mongo
    MongoClient.connect(
    uri, {useNewUrlParser: true, useUnifiedTopology: true },
    (err, client) => {
      if (err) throw err;

      // Grabs the records of ALL patrons that ever visited the foodbank
      if (Object.keys(req.body).length === 0) { // Checking for empty GET request
        coll.find({}).toArray((err, data) => {
          if (err) throw err;

          console.log(data)
        
          // Writing the data to a CSV file and downloading it in the browser
          fastcsv
            .write(data, {headers: true})
            .on("finish", function() {
              console.log("Write to database was successful.")
            })
            .pipe(res) // this was originally WriteStream
          client.close();
        });
      // Only grabs the records of patrons that visited in the specified time period
      } else if (Object.keys(req.body).length === 2) { // We should recieve only the month and the year in our request
        
        const {month, year} = req.body
        
        const start_date = new Date(parseInt(year), parseInt(month)-1); // start of the desired month
        const end_date = new Date(parseInt(year), parseInt(month)); // end of the desired month      

        coll.find({"timestamp" : {"$gte" : start_date, "$lt" : end_date}}).toArray((err, data) => {
          if (err) throw err;
          if (process.env.NODE_ENV === "development") {
            data.forEach(match => { 
              console.log(match)
            })
          }

          // Writing the data to a CSV file and downloading it in the browser
          fastcsv
            .write(data, {headers: true})
            .on("finish", function() {
              console.log("Write to database was successful.")
            })
            .pipe(res) // this was originally WriteStream
          client.close();
        });
      }
    }
  );
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
  // req.body.timestamp = new Date() // Adds the current timestamp 
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
