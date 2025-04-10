const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://job-portal-cf73e.web.app",
      "https://job-portal-cf73e.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Invalid toke" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid toke" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eahhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const jobsCollection = client.db("basic-job-portal").collection("jobs");
    const jobsApplicationCollection = client
      .db("basic-job-portal")
      .collection("job-applications");
    const productCollection = client
      .db("basic-job-portal")
      .collection("products");

    // Auth API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "12h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // logout
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // job API
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      const sort = req.query?.sort;
      let query = {};
      let sortQuery = {};
      if (email) {
        query = { hr_email: email };
      }
      if(sort == "true"){
        sortQuery = { 'salaryRange.min': -1 };
      }
      const cursor = jobsCollection.find(query).sort(sortQuery);
      const jobs = await cursor.toArray();
      res.send(jobs);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);
      res.send(job);
    });

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });
    // job application API
    app.post("/job-applications", async (req, res) => {
      const jobApplication = req.body;
      const result = await jobsApplicationCollection.insertOne(jobApplication);
      res.send(result);
    });

    app.get("/job-applications/jobs/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId };
      const result = await jobsApplicationCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/job-applications/", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };

      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden" });
      }

      const result = await jobsApplicationCollection.find(query).toArray();

      // a way of aggregate data
      for (const jobApplication of result) {
        const anotherQuery = { _id: new ObjectId(jobApplication.job_id) };
        const job = await jobsCollection.findOne(anotherQuery);
        if (job) {
          jobApplication.title = job.title;
          jobApplication.company = job.company;
          jobApplication.salaryRange = job.salaryRange;
          jobApplication.location = job.location;
          jobApplication.description = job.description;
          jobApplication.company_logo = job.company_logo;
        }
      }
      res.send(result);
    });


        // Pagination er jonno Products
        app.get("/products", async (req, res) => {
          const page = parseInt(req.query.page);
          const size = parseInt(req.query.size);
          const products = await productCollection
            .find()
            .skip(page * size)
            .limit(size)
            .toArray();
          res.send(products);
        });
    
        app.get("/productsCount", async (req, res) => {
          const count = await productCollection.estimatedDocumentCount();
          res.send({ count });
        });
    
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job lagbe hae?");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
