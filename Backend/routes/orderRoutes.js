const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const authMiddleware = require("../middleware/authMiddleware");
const {
  requireUser,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// CREATE NEW ORDER
// CUSTOMER ONLY
// =====================================

router.post("/", authMiddleware, requireUser, async (req, res) => {
  try {
    const { deliveryAddress } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({
        message: "Please provide deliveryAddress",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const totalAmount = cart.items.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user.id,
      items: cart.items,
      totalAmount,
      deliveryAddress,
    });

    cart.items = [];

    await cart.save();

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =====================================
// ADMIN - GET ALL ORDERS
// =====================================

router.get(
  "/admin/all",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: "All orders fetched successfully",
        orders,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// =====================================
// GET USER'S OWN ORDERS
// CUSTOMER ONLY
// =====================================

router.get("/", authMiddleware, requireUser, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =====================================
// GET SINGLE USER ORDER
// CUSTOMER ONLY
// =====================================

router.get(
  "/:id",
  authMiddleware,
  requireUser,
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order fetched successfully",
        order,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// =====================================
// ADMIN - UPDATE ORDER STATUS
// =====================================

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid order status",
        });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true,
        }
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// =====================================
// ADMIN - DELETE ORDER
// =====================================

router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const order = await Order.findByIdAndDelete(
        req.params.id
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order deleted successfully",
        order,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


module.exports = router;