const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();


app.use(cors());
app.use(express.json());

// 


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eahhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    const jobsCollection = client.db("basic-job-portal").collection("jobs");

    app.get('/jobs', async (req, res) => {
      const cursor = jobsCollection.find({});
      const jobs = await cursor.toArray();
      res.send(jobs);
    });

  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Job lagbe hae?');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});