const express = require("express");
const cors = require("cors");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const admin = require("firebase-admin");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@socialbuddy.vddzz.mongodb.net/${process.env.DB_DATA_BASE}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());
const port = 5000;

const serviceAccount = require("./config/burj-khalifa-uae-firebase-adminsdk-u8el3-d79ee20e67.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

client.connect((err) => {
  const booking = client.db("burjAlArab").collection("booking");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;

    booking.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
      console.log(result);
    });

    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;

    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenMail = decodedToken.email;

          const queryEmail = req.query.email;

          if (tokenMail == queryEmail) {
            booking.find({ email: queryEmail }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          } else {
            res.status(401).send("Unauthorized Access");
          }
        })

        .catch((error) => {
          console.log(error);
        });
    } else {
      res.status(401).send("Unauthorized Access");
    }
  });
});

app.listen(port);
