const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();

const port = process.env.POET || 5000;
const secret = process.env.ACCESS_TOKEN_SECRET;

//  parser
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.88ffpvi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const packageCollection = client
  .db("travelize_bd_DB")
  .collection("allPackages");

const tourGuideCollection = client
  .db("travelize_bd_DB")
  .collection("tourGuides");

const touristStoryCollection = client
  .db("travelize_bd_DB")
  .collection("touristStory");

const wishlistCollection = client.db("travelize_bd_DB").collection("wishlist");
const bookingCollection = client.db("travelize_bd_DB").collection("bookings");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // JWT related api
    app.post("/api/v1/jwt/access-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, secret, { expiresIn: "24h" });
      res.send({ token });
    });

    // Middlewares
    const verifyToken = (req, res, next) => {
      // console.log("Inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized Access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized Access" });
        }
        // console.log("Decoded", decoded);
        req.decoded = decoded;
        next();
      });
    };

    //
    app.get("/api/v1/initialPackages", async (req, res) => {
      const result = await packageCollection.find().limit(3).toArray();
      res.send(result);
    });

    app.get("/api/v1/allPackages", async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/tourGuides", async (req, res) => {
      const result = await tourGuideCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/touristStories", async (req, res) => {
      const result = await touristStoryCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/storyDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await touristStoryCollection.findOne(query);
      res.send(result);
    });

    app.get("/api/v1/viewPackages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packageCollection.findOne(query);
      res.send(result);
    });

    // Get Booking
    app.get("/api/v1/user/bookings", verifyToken, async (req, res) => {
      const queryEmail = req.query.email;
      const decodedEmail = req.decoded.email;
      let query = {};

      if (queryEmail) {
        if (queryEmail !== decodedEmail) {
          return res.status(403).send({ message: "Forbidden Access" });
        }
        query = { email: queryEmail };
      }

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    // Get Wishlist
    app.get("/api/v1/user/wishlists", verifyToken, async (req, res) => {
      const queryEmail = req.query.email;
      const decodedEmail = req.decoded.email;
      let query = {};

      if (queryEmail) {
        if (queryEmail !== decodedEmail) {
          return res.status(403).send({ message: "Forbidden Access" });
        }
      }

      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/v1/user/wishlists", verifyToken, async (req, res) => {
      const wishlist = req.body;
      const result = await wishlistCollection.insertOne(wishlist);
      res.send(result);
    });

    app.post("/api/v1/user/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.delete(
      "/api/v1/user/deleteWishlists/:id",
      verifyToken,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await wishlistCollection.deleteOne(query);
        res.send(result);
      }
    );
    // Send a ping to confirm a successful connection
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("TravelizeBD is Running");
});
app.listen(port, () => {
  console.log(`TRAVELIZEBD IS RUNNING ON PORT ${port}`);
});
