const express = require('express')
const MongoClient = require('mongodb').MongoClient
const {Translate} = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
const cors = require('cors')
const bodyParser = require('body-parser');
const { ObjectID, Cursor } = require('mongodb');
const socketio = require('socket.io');
const index = require('./routes/socketio')

const app = express()
app.use(express.json()); // JSON middleware
app.use(bodyParser.json())
app.use(cors())
app.use(index)
const port = process.env.PORT||3000

const uri = "mongodb+srv://QwertycowMoo:2Deb9281a1asdf@panlang-cluster.ipmwv.mongodb.net/mckinley-foundation?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true })
const translate = new Translate(); // creates a client


const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/', (req, res) => {
  res.send("Hello World!")
})
//********** SocketIO ********* //

const io = socketio(server)
getPeopleCollection().then(coll => {
  console.log("inside collection listner")
    io.on("connection", (socket=> {
      console.log("open tailable cursor")
      coll.find({"fulfilled": false}, {tailable:true, awaitdata:true, numberOfRetries:-1})
      .each(function(err, doc){
        console.log(doc)
        socket.emit("person", doc);
      })
    })
    )
})



//connect


/*i think what we can do is a combination of both because right now we have a socket that's just blasting things out
  and we can use a api get to get the initial things
  but then listen to the socket for the remaining things and when they are changed*/ 

//**********API Helper Functions ************* //
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


// *********** Person Endpoints *********** //

// Gets all of the person records
// Probably returns them back as a formatted text file at a button press
app.get('/person', (req, res) => {
  getPeopleCollection().then(result => {
    findResult = result.find()
    let r = []
    findResult.forEach(function(doc) {
      r.push(doc)
    }).then(function() {
      res.jsonp(r)
    })
  })

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
