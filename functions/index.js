const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Timestamp = admin.firestore.Timestamp;
var serviceAccount = require("./pan-lang-firebase-adminsdk-4lptv-9bcce7a9e5.json");

const { response } = require('express');
const {Translate} = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
const fastcsv = require("fast-csv");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pan-lang-default-rtdb.firebaseio.com"
});


// const LANGUAGES = ['es', 'de', 'fr', 'sv', 'ga', 'it', 'jp', 'zh-CN', 'sp'] //need to find the rest of the languages
// const translate = new Translate(); // creates a client

//to deploy
//********************** firebase deploy --only functions **********************/
//to emulate
//firebase emulators:start


    /**function for testing on an emulator to populate the emulator firestore database with a sample stock item */
exports.insertSampleStock = functions.https.onRequest(async (req, res) => {
    let stock_1 = 
        {"name": "Chicken Breast",
         "french": "Poitrine de poulet",
         "chinese": "鸡胸肉",
         "spanish": "Pechuga de pollo",
         "count": 26,
         "timestamp": new Timestamp(Math.floor(new Date().getTime()/1000), 0)
        }
    const writeResult = await admin.firestore().collection('stock').add(stock_1);
    res.json({result: `Message with ID: ${writeResult.id} added.`});
})

exports.insertSamplePeople = functions.https.onRequest(async (req, res) => {
    console.log("ah");
    let person_1 = 
        {"name": "Kevin",
         "numAdults": 2,
         "numChildren": 3,
         "orderNotes": "1 Box, 2 Hot Dogs, 1 Diaper",
         "zipcode": 16046,
         "fulfilled": false,
         "timestamp": new Timestamp(Math.floor(new Date()/1000), 0)
        }
    let person_2 = 
        {"name": "Renzo",
         "numAdults": 4,
         "numChildren": 4,
         "orderNotes": "1 Box, 2 Cat Food, 2 Dog Food",
         "zipcode": 61806,
         "fulfilled": false,
         "timestamp": new Timestamp(Math.floor(new Date()/1000), 0)
        }
    
    const writePantry = await admin.firestore().collection("pantries").doc("test").set({"name": "test"});
    const writeResult_1 = await admin.firestore().collection("pantries").doc("test").collection("people").add(person_1);
    const writeResult_2 = await admin.firestore().collection("pantries").doc("test").collection("people").add(person_2);
    res.json({result: `Pantry with ID: ${writePantry} with documents ${writeResult_1.id} ${writeResult_2.id} added.`});
})
/**
 * Handles the stock GET, POST, and PUT requests
 */

exports.stock = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        console.log('doing some CORS stuff');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else if (req.method === 'GET') {
        let docRef = await admin.firestore().collection("stock");
        docRef.get().then(qSnapshot => {
            let r = []
            console.log("inside docref");
            qSnapshot.forEach(doc => {
                console.log(doc.data());
                r.push(doc.data())
            });
            return res.status(200).jsonp(r);
        })
        .catch(error => {
            console.log("Error getting documents: ", error);
        });
    } else if (req.method === 'POST') { //create a new thing
        //TODO: make sure the POST request is unique: if not unique, then res.sendstatus repeat or something
        let docRef = await admin.firestore().collection("stock");
        let data = req.body;
        let fooditem = data.name;
        let _id = fooditem.replace(/\s+/g, '');
        let timestamp = new Timestamp(Math.floor(new Date()/1000), 0)
        let json = {
            "_id": _id,
            "name": fooditem,
            "count": body.count,
            "timestamp": timestamp
        }
        docRef.insertOne(json)
        .catch(error => {
            console.log("Error putting documents: ", error);
        })
        res.sendStatus(200);
    } else if (req.method === "PUT") {
        //update stock/
        //Timestamp needs to be updated
    }
})

/**
 * Handles the translation of a fooditem once inserted into the database
 */
// https://github.com/firebase/functions-samples/blob/master/message-translation/functions/index.js
exports.stockTranslate = functions.firestore.document("/stock/{stockId}")
    .onCreate(async (snapshot, context) => {
        const fooditem = snapshot.data().fooditem;
        functions.logger.log('Translating', context.params.stockId, fooditem);
        if (fooditem === undefined)  
            return; 
        
        LANGUAGES.forEach(async (language) => {
            const [result] = await translate.translate(fooditem, language);
            snapshot.ref.update({[language] : result})
        });
    });

/**
 * Handles the people GET, POST, and PUT requests
 * Timestamp will be handled by backend
 */
exports.people = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        console.log('doing some CORS stuff');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    } else if (req.method === 'GET') {
        /**
         * Expecting a req **query** with:
         * {
         *  pantry: pantry_name/email
         *  month: 12
         *  year: 2020
         * }
         */
        
        let pantry = req.query.pantry;
        functions.logger.log(req.query);
        if (pantry === undefined){
            console.log("Error, likely with pantry name");
            return res.status(500).send("Error, likely with pantry name");
        } else {
            //setup for csv transfer
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="' + 'download-' + Date.now() + '.csv"');
            //setup for current month
            const { month, year } = req.query;
            const start_date = new Date(parseInt(year || 0), parseInt(month || 1) - 1); // start of the desired month
            const end_date = new Date(parseInt(year || 9999), parseInt(month || 1)); // end of the desired month   

            let docRef = admin.firestore().collection("pantries").doc(pantry).collection("people");
            //query to get only people entries with a timestamp of the requested month
            let query = docRef.where("timestamp", ">=", new Timestamp(Math.floor(start_date/1000), 0)).where("timestamp", "<", new Timestamp(Math.floor(end_date/1000), 0));
            query.get().then(qSnapshot => {
                //add all results to an array
                console.log("inside snapshot");
                let r = [];
                qSnapshot.forEach(doc => {
                    functions.logger.log(doc.data());
                    r.push(doc.data())
                });
                //write to a csv and download
                fastcsv
                .write(r, { headers: true })
                .pipe(res)
                return res.status(200);
            })
            .catch(error => {
                r = "Error with request";
                fastcsv.write(r)
                .pipe(res);
                functions.logger.log(err);
                console.log("Error getting documents: ", error);
            });
        }
    } else if (req.method === 'POST') {
        //Works on Postman 
        /**
         * Expecting a req body of:
         * {
         *  pantry: pantry_name/email,
         *  name: Kevin Zhou,
         *  numAdults: 2,
         *  numChildren: 3,
         *  zipcode: 16046,
         *  orderNotes: 2 boxes, 2 hotdogs,
         *  fulfilled: false
         * }
         */
        //TODO: need to check if unique?
        let pantry = req.body.pantry;
        let data = req.body;
        let docRef = admin.firestore().collection("pantries").doc(pantry).collection("people");
        delete data[pantry];
        //create timestamp
        data.timestamp = new Timestamp(Math.floor(new Date()/1000), 0)
        docRef.add(data).then(() => {
            return res.sendStatus(200);
        })
        .catch(error => {
            console.log("Error putting documents: ", error);
            res.sendStatus(500);
        })
        
    } else if (req.method === 'PUT') {
        //expecting a request body of :
        /**
         * pantry: pantry_name (or email idk)
         * _id: person_id
         * fulfilled: true //note: this isn't actually being used so maybe just simplify it down so that don't need to send more stuff?
         */
        let data = req.body;
        let pantry = data.pantry;
        let docRef = admin.firestore().collection("pantries").doc(pantry).collection("people");
        console.log("data:", data);
        //beginning of today
        let startTimestamp = new Date();
        startTimestamp.setHours(0,0,0,0);
        startTimestamp = new Timestamp(Math.floor(startTimestamp.getTime()/1000), 0);
        //end of today
        let endTimestamp = new Date();
        endTimestamp.setHours(23,59,59,999);
        endTimestamp = new Timestamp(Math.floor(endTimestamp.getTime()/1000), 0);

        functions.logger.log("trying to get doc:", data._id)
        let query = docRef.doc(data._id);
        const doc = await query.get();
        if (!doc.exists) {
            functions.logger.log('No such document!');
            res.sendStatus(400).send("No such document");
        } else {
            query.update({fulfilled: true});
            res.sendStatus(200);
        }           
    }
})