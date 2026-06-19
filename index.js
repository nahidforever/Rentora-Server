const dns = require("node:dns");
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const express = require("express");
const dontenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dontenv.config();

const uri = process.env.MONGODB_URI;

const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    credentials: true,
    origin: [process.env.CLIENT_URL],
  }),
);
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
};

const ownerVerify = async (req, res, next) => {
  const user = req.user;
  if (user.role !== "owner") {
    return res.status(403).json({ msg: "Forbidden" });
  }
  next();
};

async function run() {
  try {
    await client.connect();
    const db = client.db("rentora-db");
    const userCollection = db.collection("user");
    const propertyCollection = db.collection("property");

    app.post("/owner/property", verifyToken, ownerVerify, async (req, res) => {
      try {
        const property = req.body;

        const result = await propertyCollection.insertOne({
          ...property,
          createdAt: new Date(),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to insert property" });
      }
    });

    // GET OWNER PROPERTIES
    app.get(
      "/owner/properties/:ownerId",
      verifyToken,
      ownerVerify,
      async (req, res) => {
        try {
          const { ownerId } = req.params;

          const properties = await propertyCollection
            .find({ ownerId })
            .sort({ createdAt: -1 })
            .toArray();

          res.send(properties);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch properties" });
        }
      },
    );

    app.patch(
      "/owner/property/:id",
      verifyToken,
      ownerVerify,
      async (req, res) => {
        try {
          const { id } = req.params;

          const updatedData = req.body;

          const result = await propertyCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                ...updatedData,
                updatedAt: new Date(),
              },
            },
          );
          res.send(result);
        } catch (error) {
          res.status(500).send({ error: "Failed to update property" });
        }
      },
    );

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
