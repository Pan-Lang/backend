const {Decimal128 } = require('bson');

const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb+srv://QwertycowMoo:2Deb9281a1asdf@clusterbegin.ipmwv.mongodb.net/sample_airbnb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
/*client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  console.log(result);
  client.close();
}); */

async function find() {
    await client.connect();
    const db = client.db("sample_mflix");
    const collection = db.collection("comments");
    const result = collection.find({"name": {$regex: "^Petyr"}}).limit(5);
    
    return result;
}


async function insert(data) {
    await client.connect();
    const collection = client.db("sample_mflix").collection("users");
    const result = await collection.insertOne(data);
    return result; //will return a promise for the entire result object, one of the things you can get is the insertedId property. Result object is also returned for insert many
}

//the result needs a callback function, result is a cursor
// find().then((cursor) => {
//     //cursors functions are asynchronous, they need a callback function
//     cursor.forEach(function(val) {
//         console.log(val);
//     }) 

//     /*  This is also the same thing
//     cursor.forEach(val => {
//         console.log(val);
//     }) 
//     */
// })

const newUser = {
    name: "Kevin Zou",
    email: "kevinzhou12@gmail.com",
    password: "hahaKevin2"
}

insert(newUser).then(result => {
    console.log(result);
});
