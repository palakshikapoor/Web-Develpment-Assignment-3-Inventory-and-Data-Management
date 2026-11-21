import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategorySummary,
  adjustStock
} from "../controllers/productController.js";

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts);

// Keep fixed routes before the dynamic /:id route.
router.get("/low-stock", getLowStockProducts);
router.get("/summary", getCategorySummary);
router.patch("/:id/stock", adjustStock);

router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
