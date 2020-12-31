const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require("../pan-lang-firebase-adminsdk-4lptv-9bcce7a9e5.json");

const { response } = require('express');
const {Translate} = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
const fastcsv = require("fast-csv");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pan-lang-default-rtdb.firebaseio.com"
});


const LANGUAGES = ['es', 'de', 'fr', 'sv', 'ga', 'it', 'jp', 'zn-CN', 'sp'] //need to find the rest of the languages

//to deploy
//********************** firebase deploy --only functions **********************/
//to emulate
//firebase emulators:start

exports.makeUppercase = functions.firestore.document('/messages/{documentId}')
    .onCreate((snapshot, context) => {
        //grab the current value of thing written to Firestore
        const original = snapshot.data().original;

        //Access the parameter {documentId} with context.params
        //Logs this to the log with severity "INFO"
        functions.logger.log('Uppercasing', context.params.documentId, original);

        const uppercase = original.toUpperCase();
        //return a Promise because asynchronous
        //writes to Firestore
        return snapshot.ref.set({uppercase}, {merge: true});
    })

    /**function for testing on an emulator to populate the emulator firestore database with a sample stock item */
exports.insertSampleStock = functions.https.onRequest(async (req, res) => {
    let stock_1 = 
        {"name": "Chicken Breast",
         "french": "Poitrine de poulet",
         "chinese": "鸡胸肉",
         "spanish": "Pechuga de pollo",
         "count": 26,
         "timestamp": new admin.firestore.Timestamp(Math.floor(new Date().getTime()/1000), 0)}
    const writeResult = await admin.firestore().collection('stock').add(stock_1);
    res.json({result: `Message with ID: ${writeResult.id} added.`});
})

exports.insertSamplePeople = functions.https.onRequest(async (req, res) => {
    let person_1 = 
        {"name": "Kevin",
         "numAdults": 2,
         "numChildren": 3,
         "orderNotes": "1 Box, 2 Hot Dogs, 1 Diaper",
         "zipcode": 16046,
         "fulfilled": false,
         "timestamp": new admin.firestore.Timestamp(new Date('25 Dec 2020 00:00:00 GMT')/1000, 0)
        }
    let person_2 = 
        {"name": "Renzo",
         "numAdults": 4,
         "numChildren": 4,
         "orderNotes": "1 Box, 2 Cat Food, 2 Dog Food",
         "zipcode": 61806,
         "fulfilled": true,
         "timestamp": new admin.firestore.Timestamp(new Date('25 Nov 2020 00:00:00 GMT')/1000, 0)
        }
    const writeResult_1 = await admin.firestore().collection('people').add(person_1);
    const writeResult_2 = await admin.firestore().collection('people').add(person_2);
    res.json({result: `Messages with ID: ${writeResult_1.id} ${writeResult_2.id}added.`});
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
        //TODO: make sure the POST request is unique
        let docRef = await admin.firestore().collection("stock");
        let data = req.body;
        let fooditem = data.name;
        let _id = fooditem.replace(/\s+/g, '');
        let timestamp = new admin.firestore.Timestamp(new Date());
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
    }
})

/**
 * Handles the translation of a fooditem once inserted into the database
 */
exports.stockTranslate = functions.firestore.document("/stock/{stockid}")
    .onCreate(async (snapshot, context) => {
        const fooditem = snapshot.data().fooditem;
        functions.logger.log('Translating', context.params.documentId, fooditem);
        
        const promises = []
        LANGUAGES.forEach(language => {
            promises.push(async() => { //this is from the firebase example code on github, i dont understand some of it tho
                //https://github.com/firebase/functions-samples/blob/master/message-translation/functions/index.js
                const result = await translate.translate(fooditem, language);
            });
        });
        let [translations] = await translate.translate(fooditem, lang);
        let t
        translations = Array.isArray(translations) ? translations : [translations];
        //In out implementation its only one item in translation, not an array. If you pass an array it will only return the last item in that array
        translations.forEach((translation) => {
          t = translation;
      
        });

    })

/**
 * Handles the people GET, POST, and PUT requests
 */
exports.people = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        console.log('doing some CORS stuff');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else if (req.method === 'GET') {
        //setup for csv transfer
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="' + 'download-' + Date.now() + '.csv"');
        //setup for current month
        console.log(req.query);
        const { month, year } = req.query;
        const start_date = new Date(parseInt(year || 0), parseInt(month || 1) - 1); // start of the desired month
        const end_date = new Date(parseInt(year || 9999), parseInt(month || 1)); // end of the desired month   

        let docRef = await admin.firestore().collection("people");
        //query to get only people entries with a timestamp of the requested month
        let query = docRef.where("timestamp", ">=", start_date.getTime()).where("timestamp", "<", end_date.getTime());
        query.get().then(qSnapshot => {
            //add all results to an array
            let r = []
            console.log("inside docref");
            qSnapshot.forEach(doc => {
                console.log(doc.data());
                r.push(doc.data())
            });
            //write to a csv and download
            fastcsv
            .write(r, { headers: true })
            .pipe(res)
            return res.status(200);
        })
        .catch(error => {
            console.log("Error getting documents: ", error);
        });
    } else if (req.method === 'POST') {
        //TODO: need to check if unique
        let docRef = await admin.firestore().collection("people");
        let data = req.body;
        data[timestamp] = new admin.firestore.Timestamp(new Date());
        docRef.insertOne(data)
        .catch(error => {
            console.log("Error putting documents: ", error);
        })
        res.sendStatus(200);
    } else if (req.method === 'PUT') {
        //Switching from socket to just PUT requests
        //expecting a request body of :
        /**
         * name: Kevin Zhou
         * timestamp: created by backend?
         * fulfilled: true
         */
        let docRef = await admin.firestore().collection("people");
        let data = req.body;

        //beginning of today
        let startTimestamp = new Date();
        startTimestamp.setHours(0,0,0,0);
        startTimestamp = new admin.firestore.Timestamp(startTimestamp);
        //end of today
        let endTimestamp = new Date();
        endTimestamp.setHours(23,59,59,999);
        endTimestamp = new admin.firestore.Timestamp(endTimestamp);

        let query = docRef.where("people", '==', data.name)
            .where("timestamp", ">=", startTimestamp)
            .where("timestamp", "<=", endTimestamp);
        
        query.get().then(snapshot => (
            //what if there's a repeat person? Asked McKinley, this may change later
            snapshot.forEach(doc => {
                const docId = doc.id
                const result = await docRef.get(docId).update({"fulfilled": true})
                    .catch(error => {
                        console.log(error);
                        res.sendStatus(500); //500 because error will likely be on Firebase end on not our API
                    });
            })
        ))
        res.sendStatus(200);

    }
})