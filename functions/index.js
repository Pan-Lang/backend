const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { response } = require('express');
const cors = require('cors');
admin.initializeApp();


//to deploy
//********************** firebase deploy --only functions **********************/

//this is an HTTP endpoint, but does not have a specific request, GET POST REPLACE etc
//Is also synchronous
exports.addMessage = functions.https.onRequest(async (req, res) => {
    //get text param
    //so the kind of HTTP request would be under req.method
    //but we can create other exports._________ the same way we make endpoints I think
    const original = req.query.text;
    const writeResult = await admin.firestore().collection('messages').add({original: original});
    res.json({result: `Message with ID: ${writeResult.id} added.`});
})

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
        var docRef = await admin.firestore().collection("stock");
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
        docRef = await admin.firestore().collection("stock");
        var data = req.body;
        data[timestamp] = new Date();
        docRef.insertOne(data)
        .catch(error => {
            console.log("Error putting documents: ", error);
        })
        res.sendStatus(200);
    }
})