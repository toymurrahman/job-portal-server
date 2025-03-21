const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const jobsApplicationCollection = client.db("basic-job-portal").collection("job-applications");

    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email }
      }

      const cursor = jobsCollection.find(query);
      const jobs = await cursor.toArray();
      res.send(jobs);
    });


    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);
      res.send(job);
    });

    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });
// job application API
    app.post('/job-applications', async (req, res) => {
      const jobApplication = req.body;
      const result = await jobsApplicationCollection.insertOne(jobApplication);
      res.send(result);
    })
    app.get('/job-applications/', async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobsApplicationCollection.find(query).toArray();

      // a way of aggregate data
      for (const jobApplication of result) {
        const anotherQuery = { _id: new ObjectId(jobApplication.job_id) };
        const job = await jobsCollection.findOne(anotherQuery);
        if (job) {
         
          jobApplication.title = job.title;
          jobApplication.company = job.company;
          jobApplication.salaryRange = job.salaryRange;
          // jobApplication.salaryRange.min = job.salaryRange.min;
          jobApplication.location = job.location;
          jobApplication.description = job.description;
          jobApplication.company_logo = job.company_logo;
        }
      }
      res.send(result);
    } )


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