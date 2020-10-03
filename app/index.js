const express = require('express')
const MongoClient = require('mongodb').MongoClient


const {Translate} = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
const cors = require('cors')
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const socketio = require('socket.io');
const socketindex = require('./routes/socketio')
const ObjectId = require('mongodb').ObjectId


const app = express()
app.use(express.json()); // JSON middleware
app.use(bodyParser.json())
app.use(cors())
app.use(socketindex)
const port = process.env.PORT||3000

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
const translate = new Translate(); // creates a client

console.log(uri)
const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

//********** SocketIO ********* //

const io = socketio(server)
getPeopleCollection().then(coll => {

  console.log("inside collection listner")
  //TODO: when the react app connects, starts emitting any changes based on the tailable cursor
    io.on("connection", (socket => {
    
      let cursor = coll.find({"fulfilled": false}, {tailable:true, awaitdata:true, numberOfRetries:-1})
      //console.log(cursor)
      cursor.each(function(err, doc){
        socket.emit("person", doc);
      })
      
      //socket loading is really slow idk if its because we're opening a new cursor and not closing it
      socket.on("personFulfilled", personId=> {
        let id = ObjectId(personId)  
        coll.updateOne({"_id":id},{$set: {"fulfilled": true}})  
      })
      
    })
    )
    

    
})


// *********** fastCSV Setup *********** //
const fastcsv = require("fast-csv")
const fs = require("fs")
// const writeStream = fs.createWriteStream("panlang_mongodb_fastcsv.csv")

// *********** API Helper functions for API and Socket **********//
async function getStockCollection() {
  await client.connect()
  const coll = client.db("mckinley-foundation").collection("stock")
  return coll
}

async function getPeopleCollection() {
  await client.connect()
  const coll = client.db("mckinley-foundation").collection("people")
  return coll
}

app.get('/', (req, res) => {
  translateText()
  res.send("Hello World!")
})



// *********** API Functions *********** //

async function translateText(text, lang) {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  let [translations] = await translate.translate(text, lang);
  let t
  translations = Array.isArray(translations) ? translations : [translations];
  //In out implementation its only one item in translation, not an array. If you pass an array it will only return the last item in that array
  translations.forEach((translation) => {
    t = translation;

  });
  return t
}


// *********** People Endpoints *********** //

// Grabs the records of patrons that visited the foodbank within the period of time specified in the query
// Downloads the data as a CSV file to the user's computer/smartphone
app.get('/people', async (req, res) => {

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'download-' + Date.now() + '.csv\"');

  await client.connect()
  const coll = client.db("mckinley-foundation").collection("people")

  // Grabbing the patron info from mongo
  MongoClient.connect(
    uri, { useNewUrlParser: true, useUnifiedTopology: true },
    (err, client) => {
      if (err) throw err;

      const { month, year } = req.query
      const start_date = new Date(parseInt(year || 0000), parseInt(month || 1) - 1); // start of the desired month
      const end_date = new Date(parseInt(year || 9999), parseInt(month || 1)); // end of the desired month   

      coll.find({ "timestamp": { "$gte": start_date, "$lt": end_date } }).toArray((err, data) => {
        if (err) throw err;
        if (process.env.NODE_ENV === "development") {
          data.forEach(match => {
            console.log(match)
          })
        }
        // Writing the data to a CSV file and downloading it in the browser
        fastcsv
          .write(data, { headers: true })
          .pipe(res) // this was originally WriteStream
        client.close();
      });
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
  await coll.insertOne({
    ...req.body,
    timestamp: new Date(),
  });
  res.sendStatus(200); // our response--operation was successful
})


// *********** Stock Endpoints *********** //

// Updates the amount of stock 
// Request body example: { "newCount" : 12}
app.put('/stock/:id', (req, res) => {
  let id = req.params.id
  let newCount = req.body.newCount
  console.log(id)
  getStockCollection().then(result => {
    result.findOneAndUpdate({"_id": id},{$set: {"count": newCount}}).then(collReturn => {
      res.send(`${collReturn.value._id} amount changed to ${collReturn.value.count}`)
    }).catch(err => {
      res.send("Error with id or server")
    })
  })
})

// Gets all of the stock as a JSON object
app.get('/stock', (req, res) => {
  getStockCollection().then(coll => {
    findResult = coll.find()
    let r = []
    findResult.forEach(function (doc) {
      r.push(doc)
    }).then(function () {
      res.jsonp(r)
    })
  })

})


// Creates a new stock item
// Request body example : {"name" : "Lays potato chips", "count" : 20}
app.post('/stock', (req, res) => {
  let body = req.body
  let timestamp = new Date()
  let fooditem = body.name
  let spanish, chinese, french, json
  console.log(fooditem)

  translateText(fooditem, 'es').then(sp => {
    spanish = sp;
    translateText(fooditem, 'zh').then(zh => {
      chinese = zh;
      translateText(fooditem, "fr").then(fr => {
        french = fr;
        id = fooditem.replace(/\s+/g, '');
        json = {
          "_id": id,
          "name": fooditem,
          "spanish": spanish,
          "chinese": chinese,
          "french": french,
          "count": body.count,
          "timestamp": timestamp
        }
        getStockCollection().then(coll => {
          coll.insertOne(json).then(collReturn => {
            res.send(collReturn.insertedId)
          }).catch(err => {
            res.send("item already exists!")
          })
        })
      })
    })
    
  })
})

//curl -d {\"name\":\"Beef 2lbs\"\} -H "Content-Type: application/json" -X POST "http://localhost:3000/myendpoint"
