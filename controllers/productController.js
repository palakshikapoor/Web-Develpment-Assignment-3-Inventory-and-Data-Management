import Product from "../models/Product.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidNumber = (value) =>
  value !== undefined && value !== "" && Number.isFinite(Number(value));

// CREATE PRODUCT
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// GET ALL PRODUCTS: FILTERING, SORTING AND PAGINATION
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
      page = "1",
      limit = "10"
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    }

    if (search) {
      filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (!isValidNumber(minPrice) || Number(minPrice) < 0) {
        return res.status(400).json({ message: "minPrice must be a non-negative number" });
      }

      if (!isValidNumber(maxPrice) || Number(maxPrice) < 0) {
        return res.status(400).json({ message: "maxPrice must be a non-negative number" });
      }

      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);

      if (
        filter.price.$gte !== undefined &&
        filter.price.$lte !== undefined &&
        filter.price.$gte > filter.price.$lte
      ) {
        return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
      }
    }

    const allowedSortFields = ["name", "price", "quantity", "createdAt"];
    const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    if (
      !Number.isInteger(currentPage) || currentPage < 1 ||
      !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 100
    ) {
      return res.status(400).json({
        message: "page must be a positive integer and limit must be between 1 and 100"
      });
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    res.status(200).json({
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageLimit),
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT BY ID
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT DETAILS
export const updateProduct = async (req, res, next) => {
  try {
    const allowedFields = [
      "name", "sku", "category", "price",
      "quantity", "reorderLevel", "supplier"
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Provide at least one valid field to update" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      id: product._id
    });
  } catch (error) {
    next(error);
  }
};

// LOW-STOCK REPORT
export const getLowStockProducts = async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    });

    res.status(200).json({
      count: lowStockItems.length,
      lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

// CATEGORY-WISE INVENTORY SUMMARY
export const getCategorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalStockValue: {
            $sum: { $multiply: ["$price", "$quantity"] }
          },
          avgPrice: { $avg: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      categories: summary.length,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// INCREASE OR DECREASE STOCK
export const adjustStock = async (req, res, next) => {
  try {
    const { change } = req.body;

    if (typeof change !== "number" || !Number.isInteger(change) || change === 0) {
      return res.status(400).json({
        message: "change must be a non-zero integer (positive to add, negative to remove)"
      });
    }

    const filter = { _id: req.params.id };

    if (change < 0) {
      filter.quantity = { $gte: Math.abs(change) };
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { quantity: change } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const exists = await Product.exists({ _id: req.params.id });

      if (!exists) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.status(400).json({ message: "Insufficient stock" });
    }

    res.status(200).json({
      message: "Stock updated successfully",
      product
    });
  } catch (error) {
    next(error);
  }
};
