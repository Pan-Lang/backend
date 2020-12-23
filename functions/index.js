const functions = require('firebase-functions');

const admin = require('firebase-admin');
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

exports.stock = functions.https.onRequest(async (req, res) => {
    var docRef = await admin.firestore().collection("messages");
    docRef.get().then(function(qSnapshot) {
        let r = []

        qSnapshot.forEach(function(doc) {
            r.push(doc.data())
        });
        res.jsonp(r);
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });

})