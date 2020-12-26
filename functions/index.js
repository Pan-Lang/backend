const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { response } = require('express');
const {Translate} = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs

admin.initializeApp();


const LANGUAGES = ['es', 'de', 'fr', 'sv', 'ga', 'it', 'jp', 'zn-CN', 'sp'] //need to find the rest of the languages

//to deploy
//********************** firebase deploy --only functions **********************/

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
         "timestamp": new Date()}
    const writeResult = await admin.firestore().collection('stock').add(stock_1);
    res.json({result: `Message with ID: ${writeResult.id} added.`});
})

/**
 * Handles the stock GET and PUT requests
 */
exports.stock = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        console.log('doing some CORS stuff');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
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
    } else if (req.method === 'POST') {
        let docRef = await admin.firestore().collection("stock");
        let data = req.body;
        let fooditem = data.name;
        let _id = fooditem.replace(/\s+/g, '');
        let timestamp = new Date();
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
      
        });await

    })

exports.people = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        console.log('doing some CORS stuff');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    } else if (req.method === 'GET') {
        let docRef = await admin.firestore().collection("people");
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
    } else if (req.method === 'POST') {
        let docRef = await admin.firestore().collection("people");
        let data = req.body;
        data[timestamp] = new Date();
        docRef.insertOne(data)
        .catch(error => {
            console.log("Error putting documents: ", error);
        })
        res.sendStatus(200);
    }
})