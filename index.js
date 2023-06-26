const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("portfolio server is running");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.absippg.mongodb.net/?retryWrites=true&w=majority`;

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
    const projectCollocation = client
      .db("rofikul-portfolio")
      .collection("project");

    app.post("/add-project", async (req, res) => {
      const projectInfo = req.body;
      const result = await projectCollocation.insertOne(projectInfo);
      console.log(projectInfo);
      res.send(result);
    });

    app.get("/project", async (req, res) => {
      const filter = req.query.filter;
      if (filter) {
        const result = await projectCollocation
          .find({ technologyList: { $regex: new RegExp(filter, "i") } })
          .sort({ $natural: -1 })
          .toArray();
        return res.send(result);
      } else {
        const result = await projectCollocation
          .aggregate([
            {
              $match: {}, // Add any additional match conditions if needed
            },
            {
              $addFields: {
                sortPriority: {
                  $switch: {
                    branches: [
                      { case: { $in: ["nextJs", "$technologyList"] }, then: 1 },
                      { case: { $in: ["mern", "$technologyList"] }, then: 2 },
                      { case: { $in: ["node", "$technologyList"] }, then: 3 },
                      { case: { $in: ["react", "$technologyList"] }, then: 4 },
                      { case: { $in: ["html", "$technologyList"] }, then: 5 },
                    ],
                    default: 6,
                  },
                },
              },
            },
            {
              $sort: {
                sortPriority: 1,
                _id: -1,
              },
            },
          ])
          .toArray();
        return res.send(result);
      }
    });

    app.get("/best", async (req, res) => {
      const query = { projectType: "best" };
      const result = await projectCollocation.find(query).limit(3).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
