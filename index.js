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

const tenantVerify = (req, res, next) => {
  if (req.user.role !== "tenant") {
    return res.status(403).json({ msg: "Admin only" });
  }
  next();
};

const adminVerify = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Admin only" });
  }
  next();
};

async function run() {
  try {
    await client.connect();
    const db = client.db("rentora-db");
    const userCollection = db.collection("user");
    const propertyCollection = db.collection("property");
    const favoriteCollection = db.collection("favorites");
    const bookingCollection = db.collection("booking");
    const paymentCollection = db.collection("payment");

    // Public API

    app.get("/properties", async (req, res) => {
      try {
        const search = req.query.search || "";
        const propertyType = req.query.propertyType || "";
        const sort = req.query.sort || "";

        const query = {
          status: "Approved",
        };

        if (search) {
          query.location = {
            $regex: search,
            $options: "i",
          };
        }

        if (propertyType) {
          query.propertyType = propertyType;
        }

        let sortOption = {};

        if (sort === "low") {
          sortOption = { rent: 1 };
        }

        if (sort === "high") {
          sortOption = { rent: -1 };
        }

        const properties = await propertyCollection
          .find(query)
          .sort(sortOption)
          .toArray();

        res.send(properties);
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch properties",
        });
      }
    });

    // Tenant APIS

    app.get("/property/:id", verifyToken, tenantVerify, async (req, res) => {
      try {
        const { id } = req.params;

        const property = await propertyCollection.findOne({
          _id: new ObjectId(id),
        });

        res.send(property);
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch property",
        });
      }
    });

    app.post(
      "/tenant/favorite",
      verifyToken,
      tenantVerify,
      async (req, res) => {
        try {
          const favorite = req.body;

          // duplicate check
          const exists = await favoriteCollection.findOne({
            propertyId: favorite.propertyId,
            tenantEmail: favorite.tenantEmail,
          });

          if (exists) {
            return res.send({
              acknowledged: false,
              message: "Already added",
            });
          }

          const result = await favoriteCollection.insertOne({
            ...favorite,
            createdAt: new Date(),
          });

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to add favorite",
          });
        }
      },
    );

    app.get(
      "/tenant/favorites/:email",
      verifyToken,
      tenantVerify,
      async (req, res) => {
        try {
          const { email } = req.params;

          const favorites = await favoriteCollection
            .find({ tenantEmail: email })
            .sort({ createdAt: -1 })
            .toArray();

          res.send(favorites);
        } catch (error) {
          res.status(500).send({
            error: "Failed to fetch favorites",
          });
        }
      },
    );

    app.delete(
      "/tenant/favorite/:id",
      verifyToken,
      tenantVerify,
      async (req, res) => {
        try {
          const { id } = req.params;

          const result = await favoriteCollection.deleteOne({
            _id: new ObjectId(id),
          });

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to remove favorite",
          });
        }
      },
    );

    app.post("/payment", verifyToken, tenantVerify, async (req, res) => {
      try {
        const payment = req.body;

        // save transaction
        await paymentCollection.insertOne({
          transactionId: payment.transactionId,
          propertyId: payment.propertyId,
          propertyTitle: payment.propertyTitle,

          amount: Number(payment.amount),
          ownerName: payment.ownerName,

          tenantId: payment.tenantId,
          tenantName: payment.tenantName,
          tenantEmail: payment.tenantEmail,

          paymentStatus: "Paid",

          createdAt: new Date(),
        });

        // create booking
        await bookingCollection.insertOne({
          propertyId: payment.propertyId,
          propertyTitle: payment.propertyTitle,
          propertyImage: payment.propertyImage,
          location: payment.location,
          rent: Number(payment.amount),

          ownerId: payment.ownerId,
          ownerName: payment.ownerName,
          ownerEmail: payment.ownerEmail,

          tenantId: payment.tenantId,
          tenantName: payment.tenantName,
          tenantEmail: payment.tenantEmail,

          moveInDate: payment.moveInDate,
          contactNumber: payment.contactNumber,
          additionalNotes: payment.additionalNotes,

          bookingStatus: "Pending",
          paymentStatus: "Paid",

          transactionId: payment.transactionId,

          createdAt: new Date(),
        });

        res.send({
          inserted: true,
        });
      } catch (error) {
        res.status(500).send({
          error: "Payment failed",
        });
      }
    });

    // Owner All API

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

    app.delete(
      "/owner/property/:id",
      verifyToken,
      ownerVerify,
      async (req, res) => {
        try {
          const { id } = req.params;

          const result = await propertyCollection.deleteOne({
            _id: new ObjectId(id),
          });

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to delete property",
          });
        }
      },
    );

    // All Admin API

    app.get("/admin/users", verifyToken, adminVerify, async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

    app.patch(
      "/admin/user/:id/role",
      verifyToken,
      adminVerify,
      async (req, res) => {
        try {
          const { role } = req.body;

          const result = await userCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { role } },
          );

          res.send(result);
        } catch (error) {
          res.status(500).send({ error: "Failed to update role" });
        }
      },
    );

    app.get("/admin/properties", verifyToken, adminVerify, async (req, res) => {
      try {
        const properties = await propertyCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();

        res.send(properties);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch properties" });
      }
    });

    app.patch(
      "/admin/property/:id",
      verifyToken,
      adminVerify,
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
          res.status(500).send({
            error: "Failed to update property",
          });
        }
      },
    );

    app.delete(
      "/admin/property/:id",
      verifyToken,
      adminVerify,
      async (req, res) => {
        try {
          const { id } = req.params;

          const result = await propertyCollection.deleteOne({
            _id: new ObjectId(id),
          });

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to delete property",
          });
        }
      },
    );

    app.patch(
      "/admin/property/:id/approve",
      verifyToken,
      adminVerify,
      async (req, res) => {
        try {
          const { id } = req.params;

          const result = await propertyCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                status: "Approved",
                rejectionFeedback: "",
              },
            },
          );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to approve property",
          });
        }
      },
    );

    app.patch(
      "/admin/property/:id/reject",
      verifyToken,
      adminVerify,
      async (req, res) => {
        try {
          const { id } = req.params;
          const { feedback } = req.body;

          const result = await propertyCollection.updateOne(
            {
              _id: new ObjectId(id),
            },
            {
              $set: {
                status: "Rejected",
                rejectionFeedback: feedback,
              },
            },
          );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to reject property",
          });
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
