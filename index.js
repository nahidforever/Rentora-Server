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
    return res.status(403).json({ msg: "Forbidden" });
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
    // await client.connect();

    const db = client.db("rentora-db");
    const userCollection = db.collection("user");
    const propertyCollection = db.collection("property");
    const favoriteCollection = db.collection("favorites");
    const bookingCollection = db.collection("booking");
    const paymentCollection = db.collection("payment");
    const reviewCollection = db.collection("review");

    // Public API

    app.get("/properties", async (req, res) => {
      try {
        const search = req.query.search || "";
        const propertyType = req.query.propertyType || "";
        const sort = req.query.sort || "";

        const location = req.query.location || "";
        const minPrice = req.query.minPrice || "";
        const maxPrice = req.query.maxPrice || "";

        const query = {
          status: "Approved",
        };

        // Existing Search
        if (search) {
          query.location = {
            $regex: search,
            $options: "i",
          };
        }

        // Banner Location Search
        if (location) {
          query.location = {
            $regex: location,
            $options: "i",
          };
        }

        // Property Type
        if (propertyType) {
          query.propertyType = propertyType;
        }

        // Price Range
        if (minPrice || maxPrice) {
          query.rent = {};

          if (minPrice) {
            query.rent.$gte = Number(minPrice);
          }

          if (maxPrice) {
            query.rent.$lte = Number(maxPrice);
          }
        }

        let sortOption = {};

        if (sort === "low") {
          sortOption = {
            rent: 1,
          };
        }

        if (sort === "high") {
          sortOption = {
            rent: -1,
          };
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

    app.get("/featured-properties", async (req, res) => {
      try {
        const properties = await propertyCollection
          .find({
            status: "Approved",
          })
          .limit(6)
          .toArray();

        res.send(properties);
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch featured properties",
        });
      }
    });

    app.get("/home-reviews", async (req, res) => {
      try {
        const reviews = await reviewCollection
          .find({
            rating: { $gte: 4 }, // only good reviews
          })
          .sort({
            rating: -1,
            createdAt: -1,
          })
          .limit(4)
          .toArray();

        res.send(reviews);
      } catch (error) {
        res.status(500).send({
          error: "Failed to load reviews",
        });
      }
    });

    app.get("/recent-properties", async (req, res) => {
      try {
        const properties = await propertyCollection
          .find({
            status: "Approved",
          })
          .sort({
            createdAt: -1,
          })
          .limit(6)
          .toArray();

        res.send(properties);
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch recent properties",
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

          ownerId: payment.ownerId,
          ownerName: payment.ownerName,
          ownerEmail: payment.ownerEmail,

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

    app.get("/tenant/bookings", verifyToken, tenantVerify, async (req, res) => {
      try {
        const email = req.user.email;

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalBookings = await bookingCollection.countDocuments({
          tenantEmail: email,
        });

        const bookings = await bookingCollection
          .find({
            tenantEmail: email,
          })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          bookings,
          totalPages: Math.ceil(totalBookings / limit),
          currentPage: page,
        });
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch bookings",
        });
      }
    });

    app.post("/tenant/review", verifyToken, tenantVerify, async (req, res) => {
      try {
        const review = req.body;

        const result = await reviewCollection.insertOne({
          ...review,
          rating: Number(review.rating),
          createdAt: new Date(),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({
          error: "Failed to add review",
        });
      }
    });

    app.get(
      "/reviews/:propertyId",
      verifyToken,
      tenantVerify,
      async (req, res) => {
        try {
          const { propertyId } = req.params;

          const result = await reviewCollection
            .find({
              propertyId,
            })
            .sort({
              createdAt: -1,
            })
            .toArray();

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to load reviews",
          });
        }
      },
    );

    app.get(
      "/tenant/dashboard-overview",
      verifyToken,
      tenantVerify,
      async (req, res) => {
        try {
          const tenantEmail = req.user.email;

          const totalBookings = await bookingCollection.countDocuments({
            tenantEmail,
          });

          const totalFavorites = await favoriteCollection.countDocuments({
            tenantEmail,
          });

          const payments = await paymentCollection
            .find({
              tenantEmail,
              paymentStatus: "Paid",
            })
            .toArray();

          const totalPaid = payments.reduce(
            (sum, item) => sum + item.amount,
            0,
          );

          res.send({
            totalBookings,
            totalFavorites,
            totalPaid,
          });
        } catch (error) {
          res.status(500).send({
            error: "Failed to load dashboard data",
          });
        }
      },
    );

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

    app.get("/owner/bookings", verifyToken, ownerVerify, async (req, res) => {
      try {
        const ownerEmail = req.user.email;

        const result = await bookingCollection
          .find({
            ownerEmail,
          })
          .sort({
            createdAt: -1,
          })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch bookings",
        });
      }
    });

    app.patch(
      "/owner/booking/:id/approve",
      verifyToken,
      ownerVerify,
      async (req, res) => {
        try {
          const { id } = req.params;

          const result = await bookingCollection.updateOne(
            {
              _id: new ObjectId(id),
            },
            {
              $set: {
                bookingStatus: "Approved",
              },
            },
          );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to approve booking",
          });
        }
      },
    );

    app.patch(
      "/owner/booking/:id/reject",
      verifyToken,
      ownerVerify,
      async (req, res) => {
        try {
          const { id } = req.params;

          const result = await bookingCollection.updateOne(
            {
              _id: new ObjectId(id),
            },
            {
              $set: {
                bookingStatus: "Rejected",
              },
            },
          );

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to reject booking",
          });
        }
      },
    );

    app.get("/owner/analytics", verifyToken, ownerVerify, async (req, res) => {
      try {
        const email = req.user.email;

        // total properties
        const totalProperties = await propertyCollection.countDocuments({
          ownerEmail: email,
        });

        // confirmed bookings
        const totalBookings = await bookingCollection.countDocuments({
          ownerEmail: email,
          bookingStatus: "Approved",
        });

        // paid transactions
        const payments = await paymentCollection
          .find({
            ownerName: { $exists: true },
            paymentStatus: "Paid",
          })
          .toArray();

        const ownerPayments = payments.filter(
          (item) => item.ownerEmail === email,
        );

        // total earnings
        const totalEarnings = ownerPayments.reduce(
          (sum, item) => sum + Number(item.amount),
          0,
        );

        res.send({
          totalProperties,
          totalBookings,
          totalEarnings,
        });
      } catch (error) {
        res.status(500).send({
          error: "Failed to load analytics",
        });
      }
    });

    app.get(
      "/owner/monthly-earnings",
      verifyToken,
      ownerVerify,
      async (req, res) => {
        try {
          const ownerId = req.user.id;

          const payments = await paymentCollection
            .find({
              ownerId,
              paymentStatus: "Paid",
            })
            .toArray();

          const months = {};

          payments.forEach((payment) => {
            const date = new Date(payment.createdAt);

            const month = date.toLocaleString("default", {
              month: "short",
            });

            months[month] = (months[month] || 0) + payment.amount;
          });

          const chartData = Object.entries(months).map(([month, earnings]) => ({
            month,
            earnings,
          }));

          res.send(chartData);
        } catch (error) {
          res.status(500).send({
            error: "Failed to load chart data",
          });
        }
      },
    );

    // All Admin API

    app.get("/admin/overview", verifyToken, adminVerify, async (req, res) => {
      try {
        const totalUsers = await userCollection.countDocuments();

        const totalProperties = await propertyCollection.countDocuments();

        const totalBookings = await bookingCollection.countDocuments();

        const totalTransactions = await paymentCollection.countDocuments();

        res.send({
          totalUsers,
          totalProperties,
          totalBookings,
          totalTransactions,
        });
      } catch (error) {
        res.status(500).send({
          error: "Failed to load dashboard overview",
        });
      }
    });

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
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const skip = (page - 1) * limit;

        const totalProperties = await propertyCollection.countDocuments();

        const properties = await propertyCollection
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          properties,
          totalPages: Math.ceil(totalProperties / limit),
          currentPage: page,
        });
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch properties",
        });
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

    app.get("/admin/bookings", verifyToken, adminVerify, async (req, res) => {
      try {
        const bookings = await bookingCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();

        res.send(bookings);
      } catch (error) {
        res.status(500).send({
          error: "Failed to load bookings",
        });
      }
    });

    app.get(
      "/admin/transactions",
      verifyToken,
      adminVerify,
      async (req, res) => {
        try {
          const result = await paymentCollection
            .find()
            .sort({ createdAt: -1 })
            .toArray();

          res.send(result);
        } catch (error) {
          res.status(500).send({
            error: "Failed to fetch transactions",
          });
        }
      },
    );

    // await client.db("admin").command({ ping: 1 });
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
