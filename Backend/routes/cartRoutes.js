const express = require("express");

const Cart = require("../models/Cart");
const Product = require("../models/Product");

const authMiddleware = require("../middleware/authMiddleware");
const { requireUser } = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET CART
// =====================================================

router.get("/", authMiddleware, requireUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({
      user: req.user.id
    }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });

      // Populate after creating the cart
      await cart.populate("items.product");
    }

    return res.status(200).json({
      message: "Cart fetched successfully",
      cart
    });

  } catch (error) {
    console.error("GET CART ERROR:", error);

    return res.status(500).json({
      message: "Unable to load cart."
    });
  }
});


// =====================================================
// ADD ITEM TO CART
// =====================================================

router.post("/", authMiddleware, requireUser, async (req, res) => {
  try {
    const productId = String(req.body.product || "").trim();
    const quantity = Number(req.body.quantity);

    console.log(
      "ADD TO CART:",
      req.user.id,
      productId,
      quantity
    );

    // -----------------------------
    // Validate product
    // -----------------------------

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required."
      });
    }

    // -----------------------------
    // Validate quantity
    // -----------------------------

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message: "Quantity must be at least 1."
      });
    }

    // -----------------------------
    // Find product
    // -----------------------------

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    // -----------------------------
    // Check availability
    // -----------------------------

    if (product.isAvailable === false) {
      return res.status(400).json({
        message: "Product is currently unavailable."
      });
    }

    // -----------------------------
    // Find user's cart
    // -----------------------------

    let cart = await Cart.findOne({
      user: req.user.id
    });

    // =================================================
    // CREATE NEW CART
    // =================================================

    if (!cart) {

      cart = new Cart({
        user: req.user.id,
        items: [
          {
            product: product._id,
            quantity: quantity,
            price: Number(product.price) || 0
          }
        ]
      });

    }

    // =================================================
    // EXISTING CART
    // =================================================

    else {

      const existingItem =
        cart.items.find(
          item =>
            item.product &&
            item.product.toString() === productId
        );

      // -----------------------------
      // Product already exists
      // -----------------------------

      if (existingItem) {

        existingItem.quantity =
          Number(existingItem.quantity || 0) +
          quantity;

        // Always use latest product price
        existingItem.price =
          Number(product.price) || 0;

      }

      // -----------------------------
      // New product
      // -----------------------------

      else {

        cart.items.push({
          product: product._id,
          quantity: quantity,
          price: Number(product.price) || 0
        });

      }

    }

    // -----------------------------
    // Save cart
    // -----------------------------

    await cart.save();

    // -----------------------------
    // Populate product information
    // -----------------------------

    await cart.populate("items.product");

    console.log(
      "CART UPDATED:",
      cart._id.toString()
    );

    return res.status(200).json({
      message: "Item added to cart successfully.",
      cart
    });

  } catch (error) {

    console.error(
      "ADD TO CART ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to add item to cart."
    });
  }
});


// =====================================================
// UPDATE CART ITEM
// =====================================================

router.put(
  "/:productId",
  authMiddleware,
  requireUser,
  async (req, res) => {

    try {

      const productId =
        String(req.params.productId || "").trim();

      const quantity =
        Number(req.body.quantity);

      if (!productId) {
        return res.status(400).json({
          message: "Product ID is required."
        });
      }

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          message: "Quantity must be at least 1."
        });
      }

      const cart =
        await Cart.findOne({
          user: req.user.id
        });

      if (!cart) {
        return res.status(404).json({
          message: "Cart not found."
        });
      }

      const item =
        cart.items.find(
          item =>
            item.product &&
            item.product.toString() === productId
        );

      if (!item) {
        return res.status(404).json({
          message: "Product not found in cart."
        });
      }

      item.quantity = quantity;

      // Refresh price from product
      const product =
        await Product.findById(productId);

      if (product) {
        item.price =
          Number(product.price) || 0;
      }

      await cart.save();

      await cart.populate("items.product");

      return res.status(200).json({
        message: "Cart item updated successfully.",
        cart
      });

    } catch (error) {

      console.error(
        "UPDATE CART ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to update cart."
      });
    }
  }
);


// =====================================================
// REMOVE ITEM FROM CART
// =====================================================

router.delete(
  "/:productId",
  authMiddleware,
  requireUser,
  async (req, res) => {

    try {

      const productId =
        String(req.params.productId || "").trim();

      const cart =
        await Cart.findOne({
          user: req.user.id
        });

      if (!cart) {
        return res.status(404).json({
          message: "Cart not found."
        });
      }

      const oldLength =
        cart.items.length;

      cart.items =
        cart.items.filter(
          item =>
            !item.product ||
            item.product.toString() !== productId
        );

      if (cart.items.length === oldLength) {
        return res.status(404).json({
          message: "Product not found in cart."
        });
      }

      await cart.save();

      await cart.populate("items.product");

      return res.status(200).json({
        message: "Item removed from cart successfully.",
        cart
      });

    } catch (error) {

      console.error(
        "REMOVE CART ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to remove item from cart."
      });
    }
  }
);


// =====================================================
// CLEAR CART
// =====================================================

router.delete(
  "/",
  authMiddleware,
  requireUser,
  async (req, res) => {

    try {

      const cart =
        await Cart.findOne({
          user: req.user.id
        });

      if (!cart) {
        return res.status(200).json({
          message: "Cart already empty.",
          cart: {
            user: req.user.id,
            items: []
          }
        });
      }

      cart.items = [];

      await cart.save();

      await cart.populate("items.product");

      return res.status(200).json({
        message: "Cart cleared successfully.",
        cart
      });

    } catch (error) {

      console.error(
        "CLEAR CART ERROR:",
        error
      );

      return res.status(500).json({
        message: "Unable to clear cart."
      });
    }
  }
);


module.exports = router;