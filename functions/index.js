const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Timestamp = admin.firestore.Timestamp;
let serviceAccount = require("./pan-lang-firebase-sdk-service.json");

const { response } = require('express');
const { Translate } = require('@google-cloud/translate').v2; // Import Google's Node.js client library for the Translate API https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
const fastcsv = require("fast-csv");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pan-lang-default-rtdb.firebaseio.com"
});


const translate = new Translate(); // creates a client
const LANGUAGES = ['ar', //Arabic
                'be', //Belarusian
                'zh-CN', //Chinese (Simplified)
                'hr', //Croatian
                'da', //Danish
                'et', //Estonian
                'tl', //Filipino
                'fi', //Finnish
                'fr', //French
                'de', //German
                'el', //Greek
                'ht', //Haitian Creole
                'iw', //Hebrew
                'hi', //Hindi
                'id', //Indonesian
                'ja', //Japanese
                'pl', //Polish
                'es', //Spanish
                'th', //Thai
                'vi', //Vietnamese
                ]

//to deploy
//********************** firebase deploy --only functions **********************/
//to emulate
//firebase emulators:start

/**function for testing on an emulator to populate the emulator firestore database with a sample stock item */

exports.insertSampleStock = functions.https.onRequest(async (req, res) => {
    let stock_1 =
    {
        "name": "Chicken Breast",
        "french": "Poitrine de poulet",
        "chinese": "鸡胸肉",
        "spanish": "Pechuga de pollo",
        "count": 26,
        "timestamp": new Timestamp(Math.floor(new Date().getTime() / 1000), 0)
    }
    const writePantry = await admin.firestore().collection("pantries").doc("test@gmail.com").set({ "name": "test" });
    const writeResult = await admin.firestore().collection("pantries").doc("test@gmail.com").collection('stock').doc("chickenbreast").set(stock_1);
    res.json({ result: `Pantry ${writePantry} created with message ${writeResult.value} added.` });
})

exports.insertSamplePeople = functions.https.onRequest(async (req, res) => {

    let person_1 =
    {
        "name": "Kevin",
        "numAdults": 2,
        "numChildren": 3,
        "orderNotes": "1 Box, 2 Hot Dogs, 1 Diaper",
        "zipcode": 16046,
        "fulfilled": false,
        "timestamp": new Timestamp(Math.floor(new Date() / 1000), 0)
    }
    let person_2 =
    {
        "name": "Renzo",
        "numAdults": 4,
        "numChildren": 4,
        "orderNotes": "1 Box, 2 Cat Food, 2 Dog Food",
        "zipcode": 61806,
        "fulfilled": false,
        "timestamp": new Timestamp(Math.floor(new Date() / 1000), 0)
    }

    const writePantry = await admin.firestore().collection("pantries").doc("test@gmail.com").set({ "name": "test" });
    const writeResult_1 = await admin.firestore().collection("pantries").doc("test@gmail.com").collection("people").add(person_1);
    const writeResult_2 = await admin.firestore().collection("pantries").doc("test@gmail.com").collection("people").add(person_2);
    res.json({ result: `Pantry with ID: ${writePantry} with documents ${writeResult_1.id} ${writeResult_2.id} added.` });
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
        /** Expects a request **query** of:
         * {
         *   pantry: pantry_id
         * }
         */
        let pantry = req.query.pantry;
        functions.logger.log(pantry);
        let docRef = admin.firestore().collection("pantries").doc(pantry).collection("stock");
        docRef.get().then(qSnapshot => {
            let r = []
            qSnapshot.forEach(doc => {
                let data = doc.data();
                data._id= doc.id;
                console.log(data)
                r.push(data)
            });
            return res.status(200).jsonp(r);
        })
            .catch(error => {
                console.log("Error getting documents: ", error);
                return res.sendstatus(422)
            });
    } else if (req.method === 'POST') {
        /** Expects a req body with:
         * {
            "pantry": pantry_id
            "name": "Item Name"
            "count": {new_count} (Integer)
           }
         * 
         */
        let data = req.body;
        let pantry = data.pantry;

        let docRef = admin.firestore().collection("pantries").doc(pantry).collection("stock");
        let fooditem = data.name;
        let _id = fooditem.replace(/\s+/g, '');

        //check for uniqueness
        let query = docRef.doc(_id);
        let checkDoc = await query.get();
        if (!checkDoc.exists) {
            let timestamp = new Timestamp(Math.floor(new Date() / 1000), 0)
            let json = {
                "name": fooditem,
                "count": data.count,
                "timestamp": timestamp
            }
            docRef.doc(_id).set(json).then(() => {
                return res.sendStatus(200);
            })
                .catch(error => {
                    res.status(500).send("something went wrong, " + error);
                    console.log("Error putting documents: ", error);
                })

        } else {
            res.status(422).send("This is a repeat item"); //this code may have to be changed
        }

    } else if (req.method === "PUT") {
        /** Expects a req body with:
         * {
            "pantry": pantry_id
            "_id": fooditem
            "newCount": newCount
            }
         */
        let data = req.body;
        let pantry = data.pantry;
        let _id = data._id;
        let newCount = data.newCount;
        
        console.log("PUT", data);

        if (pantry === undefined) {
            res.status(422).send("Problem with pantry name.");
        } else {
            let docRef = admin.firestore().collection("pantries").doc(pantry).collection("stock").doc(_id);
            docRef.update({ count: newCount })
            docRef.update({ timestamp: new Timestamp(Math.floor(new Date() / 1000), 0) })
            res.status(204).send("updated successfully");
            
        }

    }
})

/**
 * Handles the translation of a fooditem once inserted into the database
 */
// https://github.com/firebase/functions-samples/blob/master/message-translation/functions/index.js
exports.stockTranslate = functions.firestore.document("/pantries/{pantryId}/stock/{stockId}")
    .onCreate(async (snapshot, context) => {

        const fooditem = snapshot.data();
        console.log(fooditem);
        if (fooditem.translated) {
            console.log("food item already translated");
            return null;
        }
        
        if (fooditem === undefined)  {
            console.log("fooditem is undefined");
            return -1;
        }

        functions.logger.log('Translating', context.params.stockId, fooditem.name);
        LANGUAGES.forEach(async (language) => {
            let [result] = await translate.translate(fooditem.name, language);
            let translationProp = "translations." + language; //this puts everything under "translations" and then the respective language
            snapshot.ref.update({[translationProp]: result });
        });
        snapshot.ref.update({translated: true}).then(() => {
            return 0;
        }).catch((err) => {
            console.log(err);
            return -1;
        })
        
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
         *  pantry: pantry_id
         *  month: 1-12
         *  year: 2020
         * }
         */

        let pantry = req.query.pantry;
        functions.logger.log(req.query);
        if (pantry === undefined) {
            console.log("Error, likely with pantry name");
            return res.status(422).send("Error, likely with pantry name");
        } else {
            //setup for csv transfer
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="' + 'order-data-' + new Date().toString() + '.csv"');
            //setup for current month
            const { month, year } = req.query;
            const start_date = new Date(parseInt(year || 0), parseInt(month || 1) - 1); // start of the desired month
            const end_date = new Date(parseInt(year || 9999), parseInt(month || 1)); // end of the desired month   

            let docRef = admin.firestore().collection("pantries").doc(pantry).collection("people");
            //query to get only people entries with a timestamp of the requested month
            let query = docRef.where("timestamp", ">=", new Timestamp(Math.floor(start_date / 1000), 0)).where("timestamp", "<", new Timestamp(Math.floor(end_date / 1000), 0));
            query.get().then(qSnapshot => {
                //add all results to an array
                console.log("inside snapshot");
                let r = [];
                qSnapshot.forEach(doc => {
                    let docData = doc.data();
                    docData.timestamp = docData.timestamp.toDate().toString();
                    r.push(docData)
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
                    functions.logger.log(error);

                    console.log("Error getting documents: ", error);
                    return error;
                });
        }
    } else if (req.method === 'POST') {
        //Works on Postman 
        /**
         * Expecting a req body of:
         * {
         *  pantry: pantry_id,
         *  firstName: Kevin
         *  lastName: Zhou
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
        delete data.pantry;
        //create timestamp
        data.timestamp = new Timestamp(Math.floor(new Date() / 1000), 0)
        docRef.add(data).then(() => {
            return res.sendStatus(200);
        })
            .catch(error => {
                console.log("Error putting documents: ", error);
                return res.sendStatus(422);
            })

    } else if (req.method === 'PUT') {
        //expecting a request body of :
        /**
         * pantry: pantry_id
         * _id: person_id
         * fulfilled: true //note: this isn't actually being used so maybe just simplify it down so that don't need to send more stuff?
         */
        let data = req.body;
        let pantry = data.pantry;
        let docRef = admin.firestore().collection("pantries").doc(pantry).collection("people");
        console.log("data:", data);
        //beginning of today
        let startTimestamp = new Date();
        startTimestamp.setHours(0, 0, 0, 0);
        startTimestamp = new Timestamp(Math.floor(startTimestamp.getTime() / 1000), 0);
        //end of today
        let endTimestamp = new Date();
        endTimestamp.setHours(23, 59, 59, 999);
        endTimestamp = new Timestamp(Math.floor(endTimestamp.getTime() / 1000), 0);

        functions.logger.log("trying to get doc:", data._id)
        let query = docRef.doc(data._id);
        const doc = await query.get();
        if (!doc.exists) {
            functions.logger.log('No such document!');
            return res.sendStatus(400).send("No such document");
        } else {
            query.update({ fulfilled: true });
            query.update({ Timestamp: new Timestamp(Math.floor(new Date() / 1000), 0) })
            return res.sendStatus(200);
        }
    }
})

exports.pantry = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        console.log('doing some CORS stuff');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    } else if (req.method === 'POST') {
        /**Expects a body with:
         * {
         *   uid: auth.uid
         *   email: pantry@sample.com
         *   name : Pantry Name
         * }
         */
        let data = req.body;
        let docRef = admin.firestore().collection("pantries").doc(data.uid);
        if (!docRef.exists) {
            const writePantry = await admin.firestore().collection("pantries").doc(data.uid).set({ "name": data.name, "email": data.email });
            return res.status(204).send(`Pantry with id: ${writePantry} inserted`);
        } else {
            return res.status(422).send("Pantry already exists!");
        }
        
        
    }
});
