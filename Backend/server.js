const dns = require("dns");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const connectDB = require("./config/db");

const User = require("./models/User");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const userRoutes = require("./routes/userRoutes");


// =========================
// DNS
// =========================

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);


// =========================
// EXPRESS APP
// =========================

const app = express();


// =========================
// MIDDLEWARE
// =========================

app.use(cors());

app.use(express.json());


// =========================
// ROUTES
// =========================

app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);


// =========================
// HOME ROUTE
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "Meeru Fast Food API is running 🚀"
  });
});


// =========================
// CREATE ADMIN ACCOUNT
// =========================

const createAdminAccount = async () => {
  try {

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;


    // Check admin credentials
    if (!adminEmail || !adminPassword) {

      console.log(
        "Admin credentials not found in .env"
      );

      return;
    }


    const normalizedEmail =
      adminEmail.toLowerCase().trim();


    // Find existing admin
    let admin = await User.findOne({
      email: normalizedEmail
    });


    // =========================
    // CREATE ADMIN
    // =========================

    if (!admin) {

      const hashedPassword =
        await bcrypt.hash(adminPassword, 10);


      await User.create({

        name: "Admin",

        email: normalizedEmail,

        password: hashedPassword,

        role: "admin"

      });


      console.log(
        "Admin account created successfully."
      );

    }


    // =========================
    // EXISTING ACCOUNT
    // =========================

    else {

      if (admin.role !== "admin") {

        admin.role = "admin";

        await admin.save();


        console.log(
          "Existing account promoted to admin."
        );

      }

      else {

        console.log(
          "Admin account already exists."
        );

      }

    }

  } catch (error) {

    console.error(
      "Admin account error:",
      error
    );

  }
};


// =========================
// SERVER START
// =========================

const PORT = process.env.PORT || 5000;


const startServer = async () => {

  try {

    // Connect MongoDB
    await connectDB();


    // Create/check admin
    await createAdminAccount();


    // Start server
    app.listen(PORT, () => {

      console.log(
        `Server running on http://localhost:${PORT}`
      );

    });

  } catch (error) {

    console.error(
      "Failed to start server:",
      error
    );

  }

};


startServer();