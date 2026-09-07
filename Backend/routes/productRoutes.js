const express = require("express");
const Product = require("../models/Product");

const authMiddleware = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// ADD NEW PRODUCT
// ADMIN ONLY
// =====================================

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        price,
        category,
        image,
        description,
        isAvailable,
      } = req.body;

      // Validate required fields
      if (!name || price === undefined || !category) {
        return res.status(400).json({
          message: "Please provide name, price and category",
        });
      }

      // Validate price
      if (Number(price) < 0) {
        return res.status(400).json({
          message: "Price cannot be negative",
        });
      }

      // Create product
      const product = await Product.create({
        name: name.trim(),
        price: Number(price),
        category: category.trim(),
        image: image || "",
        description: description || "",
        isAvailable:
          isAvailable !== undefined
            ? Boolean(isAvailable)
            : true,
      });

      res.status(201).json({
        message: "Product added successfully",
        product,
      });

    } catch (error) {
      console.error("Add product error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// =====================================
// GET ALL PRODUCTS
// PUBLIC
// =====================================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      message: "Products fetched successfully",
      products,
    });

  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =====================================
// GET SINGLE PRODUCT
// PUBLIC
// =====================================

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product fetched successfully",
      product,
    });

  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =====================================
// UPDATE PRODUCT
// ADMIN ONLY
// =====================================

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        price,
        category,
        image,
        description,
        isAvailable,
      } = req.body;

      // Validate required fields
      if (!name || price === undefined || !category) {
        return res.status(400).json({
          message: "Please provide name, price and category",
        });
      }

      // Validate price
      if (Number(price) < 0) {
        return res.status(400).json({
          message: "Price cannot be negative",
        });
      }

      const product =
        await Product.findByIdAndUpdate(
          req.params.id,
          {
            name: name.trim(),
            price: Number(price),
            category: category.trim(),
            image: image || "",
            description: description || "",
            isAvailable:
              isAvailable !== undefined
                ? Boolean(isAvailable)
                : true,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.status(200).json({
        message: "Product updated successfully",
        product,
      });

    } catch (error) {
      console.error("Update product error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// =====================================
// DELETE PRODUCT
// ADMIN ONLY
// =====================================

router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const product =
        await Product.findByIdAndDelete(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.status(200).json({
        message: "Product deleted successfully",
        product,
      });

    } catch (error) {
      console.error("Delete product error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


module.exports = router;