const mongoose = require("mongoose");

const DharamshalaAsset =
  require("../models/DharamshalaAsset");

const DharamshalaAssetTransaction =
  require("../models/DharamshalaAssetTransaction");

const DharamshalaInventoryItem =
  require("../models/DharamshalaInventoryItem");

const DharamshalaInventoryTransaction =
  require("../models/DharamshalaInventoryTransaction");


const {
  generateAssetNumber,
  generateInventoryItemCode,
  generateStockTransactionNumber,
  generateAssetTransactionNumber,
} = require("../utils/NumberGenerater");

const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );

const  buildResponse  = require("../utils/response");
const DataConstant = require("../constants/DataConstant");
const logger = require("../utils/logger");



const DharamshalaItem = require("../models/DharamshalaItem");
const { generateItemCode } = require("../utils/NumberGenerater");

const normalizeItemName = (name = "") =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/s$/, "");

const resolveItemMasterId = async ({ itemId, itemName, itemNature }) => {
  const filter = itemId
    ? { _id: itemId, itemNature, statusFlag: 1 }
    : {
        normalizedName: normalizeItemName(itemName),
        itemNature,
        statusFlag: 1,
      };

  const itemMaster = await DharamshalaItem.findOne(filter)
    .select("_id")
    .lean();

  return itemMaster?._id || null;
};

exports.addUpdateItem = async (data) => {
  try {
    const {
      id,
      itemName,
      itemNature,
      category,
      defaultUnit,
      description,
      createdBy,
      updatedBy,
    } = data;

    if (!itemName?.trim()) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "itemName is required");
    }

    if (!itemNature) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "itemNature is required");
    }

    if (!["ASSET", "INVENTORY"].includes(itemNature)) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "Invalid itemNature");
    }

    const validCategories = DharamshalaItem.schema.path("category").enumValues;
    const finalCategory = category || "OTHER";

    if (!validCategories.includes(finalCategory)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid category"
      );
    }

    const normalizedName = normalizeItemName(itemName);

    if (!normalizedName) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "itemName must contain letters or numbers"
      );
    }

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Invalid item id"
        );
      }

      const item = await DharamshalaItem.findById(id);

      if (!item) {
        return buildResponse(DataConstant.CLIENT_ERROR.NOT_FOUND, "Item not found");
      }

      const duplicate = await DharamshalaItem.findOne({
        _id: { $ne: id },
        normalizedName,
        itemNature,
      });

      if (duplicate) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.CONFLICT,
          "Same item already exists"
        );
      }

      item.itemName = itemName.trim();
      item.normalizedName = normalizedName;
      item.itemNature = itemNature;
      item.category = category || item.category;
      item.defaultUnit = defaultUnit || item.defaultUnit;
      item.description =
        description === undefined ? item.description : description;
      item.updatedBy = updatedBy || createdBy || item.updatedBy || null;

      await item.save();

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Item updated successfully",
        item
      );
    }

    const existing = await DharamshalaItem.findOne({
      normalizedName,
      itemNature,
    });

    if (existing) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.CONFLICT,
        "Same item already exists",
        existing
      );
    }

    const itemCode = await generateItemCode();

    const item = await DharamshalaItem.create({
      itemCode,
      itemName: itemName.trim(),
      normalizedName,
      itemNature,
      category: finalCategory,
      defaultUnit: defaultUnit || "Piece",
      description: description || "",
      createdBy: createdBy || null,
    });

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Item added successfully",
      item
    );
  } catch (err) {
    logger.error("addUpdateItem service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

exports.getAllItems = async (data) => {
  try {
    const {
      pageIndex = 0,
      pageSize = 10,
      itemNature,
      category,
      searchText = "",
      statusFlag = 1,
    } = data;

    const filter = {};

    if (statusFlag !== "") {
      const numericStatus = Number(statusFlag);

      if (![1, 2].includes(numericStatus)) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "statusFlag should be 1 or 2"
        );
      }

      filter.statusFlag = numericStatus;
    }

    if (itemNature) filter.itemNature = itemNature;
    if (category) filter.category = category;

    if (searchText?.trim()) {
      filter.$or = [
        { itemCode: { $regex: searchText.trim(), $options: "i" } },
        { itemName: { $regex: searchText.trim(), $options: "i" } },
        { normalizedName: { $regex: searchText.trim(), $options: "i" } },
        { category: { $regex: searchText.trim(), $options: "i" } },
      ];
    }

    const skip = Number(pageIndex) * Number(pageSize);
    const limit = Number(pageSize);

    const totalElements = await DharamshalaItem.countDocuments(filter);

    const items = await DharamshalaItem.find(filter)
      .populate("createdBy", "name mobileNumber profileUrl")
      .populate("updatedBy", "name mobileNumber profileUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Items fetched successfully",
      {
        content: items,
        pageIndex: Number(pageIndex),
        pageSize: Number(pageSize),
        totalElements,
        totalPages: Math.ceil(totalElements / limit),
      }
    );
  } catch (err) {
    logger.error("getAllItems service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

exports.blockUnblockItem = async (data) => {
  try {
    const { id, statusFlag, updatedBy } = data;

    if (!id) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "id is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid item id"
      );
    }

    if (![1, 2, "1", "2"].includes(statusFlag)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "statusFlag should be 1 or 2"
      );
    }

    const item = await DharamshalaItem.findById(id);

    if (!item) {
      return buildResponse(DataConstant.CLIENT_ERROR.NOT_FOUND, "Item not found");
    }

    item.statusFlag = Number(statusFlag);
    item.updatedBy = updatedBy || item.updatedBy || null;

    await item.save();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      Number(statusFlag) === 1
        ? "Item activated successfully"
        : "Item blocked successfully",
      item
    );
  } catch (err) {
    logger.error("blockUnblockItem service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

exports.addStockTransaction = async (data) => {
  try {
    const {
      dharamshalaId,
      inventoryItemId,
      transactionType,
      quantity,
      unit = "Piece",
      unitPrice,
      rate = 0,
      amount,
      sourceType = "MANUAL",
      expenseId = null,
      donationId = null,
      referenceNumber = "",
      remarks = "",
      createdBy,
    } = data;

    if (!dharamshalaId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "dharamshalaId is required"
      );
    }

    if (!inventoryItemId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "inventoryItemId is required"
      );
    }

    if (!transactionType) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "transactionType is required"
      );
    }

    if (!quantity || Number(quantity) <= 0) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "quantity should be greater than zero"
      );
    }

    const item =
      await DharamshalaInventoryItem.findById(inventoryItemId);

    if (!item) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Inventory item not found"
      );
    }

    const finalUnitPrice = Number(unitPrice ?? rate ?? 0);

    if (transactionType === "PURCHASE" && finalUnitPrice <= 0) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "unitPrice should be greater than zero for purchase"
      );
    }

    const masterItemId = await resolveItemMasterId({
      itemId: item.itemId,
      itemName: item.itemName,
      itemNature: "INVENTORY",
    });

    if (!masterItemId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Inventory item is not linked to an active item master"
      );
    }

    const stockBefore = Number(item.currentStock || 0);
    const qty = Number(quantity);

    const increaseTypes = [
      "OPENING",
      "PURCHASE",
      "DONATION",
      "RETURN",
      "ADJUSTMENT_IN",
    ];

    const decreaseTypes = [
      "CONSUMPTION",
      "DAMAGE",
      "LOST",
      "TRANSFER",
      "ADJUSTMENT_OUT",
    ];

    let stockAfter = stockBefore;

    if (increaseTypes.includes(transactionType)) {
      stockAfter = stockBefore + qty;
    } else if (decreaseTypes.includes(transactionType)) {
      if (stockBefore < qty) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Insufficient stock"
        );
      }

      stockAfter = stockBefore - qty;
    } else {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid transactionType"
      );
    }

    const transactionNumber =
      await generateStockTransactionNumber();

    const finalAmount =
      transactionType === "PURCHASE"
        ? Number((finalUnitPrice * qty).toFixed(2))
        : amount !== undefined
          ? Number(amount || 0)
          : Number((finalUnitPrice * qty).toFixed(2));

    const transaction =
      await DharamshalaInventoryTransaction.create({
        dharamshalaId,
        itemId: masterItemId,
        inventoryItemId,
        transactionNumber,
        transactionType,
        quantity: qty,
        unit,
        unitPrice: finalUnitPrice,
        totalAmount: finalAmount,
        rate: finalUnitPrice,
        amount: finalAmount,
        stockBefore,
        stockAfter,
        sourceType,
        expenseId,
        donationId,
        referenceNumber,
        remarks,
        createdBy,
      });

    item.currentStock = stockAfter;
    item.itemId = masterItemId;
    item.updatedBy = createdBy;

    await item.save();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Stock transaction added successfully",
      transaction
    );
  } catch (err) {
    logger.error("addStockTransaction service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

exports.getStockTransactions = async (data) => {
  try {
    const {
      pageIndex = 0,
      pageSize = 10,
      dharamshalaId,
      inventoryItemId,
      transactionType,
      sourceType,
      searchText = "",
      fromDate,
      toDate,
      statusFlag = 1,
    } = data;

    const filter = {
      statusFlag: Number(statusFlag),
    };

    if (dharamshalaId) {
      filter.dharamshalaId = dharamshalaId;
    }

    if (inventoryItemId) {
      filter.inventoryItemId = inventoryItemId;
    }

    if (transactionType) {
      filter.transactionType = transactionType;
    }

    if (sourceType) {
      filter.sourceType = sourceType;
    }

    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    if (searchText && searchText.trim()) {
      filter.$or = [
        {
          transactionNumber: {
            $regex: searchText.trim(),
            $options: "i",
          },
        },
        {
          referenceNumber: {
            $regex: searchText.trim(),
            $options: "i",
          },
        },
        {
          remarks: {
            $regex: searchText.trim(),
            $options: "i",
          },
        },
      ];
    }

    const skip = Number(pageIndex) * Number(pageSize);
    const limit = Number(pageSize);

    const totalElements =
      await DharamshalaInventoryTransaction.countDocuments(filter);

    const transactions =
      await DharamshalaInventoryTransaction.find(filter)
        .populate("dharamshalaId", "name")
        .populate(
          "inventoryItemId",
          "itemCode itemName category unit currentStock minimumStock location"
        )
        .populate("expenseId", "expenseNumber title amount")
        .populate(
          "donationId",
          "receiptNumber donorType donationType amount itemName quantity"
        )
        .populate("createdBy", "name mobileNumber profileUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Stock transactions fetched successfully",
      {
        content: transactions,
        pageIndex: Number(pageIndex),
        pageSize: Number(pageSize),
        totalElements,
        totalPages: Math.ceil(totalElements / limit),
      }
    );
  } catch (err) {
    logger.error("getStockTransactions service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

exports.getStockTransactionById = async (id) => {
  try {
    if (!id) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Stock transaction id is required"
      );
    }

    const transaction =
      await DharamshalaInventoryTransaction.findById(id)
        .populate("dharamshalaId", "name")
        .populate(
          "inventoryItemId",
          "itemCode itemName category unit currentStock minimumStock location"
        )
        .populate("expenseId", "expenseNumber title amount")
        .populate(
          "donationId",
          "receiptNumber donorType donationType amount itemName quantity"
        )
        .populate("createdBy", "name mobileNumber profileUrl")
        .lean();

    if (!transaction) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Stock transaction not found"
      );
    }

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Stock transaction fetched successfully",
      transaction
    );
  } catch (err) {
    logger.error("getStockTransactionById service error", {
      error: err.message,
      stack: err.stack,
      id,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};
exports.addOrUpdateInventoryItem =
  async (data) => {
    try {
      const {
        id,
        dharamshalaId,
        itemId,
        itemName,
        category,
        unit = "Piece",
        minimumStock = 0,
        location = "",
        remarks = "",
        createdBy,
        updatedBy,
      } = data;

      if (!itemName) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "itemName is required"
        );
      }

      if (!category) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "category is required"
        );
      }

      if (id) {
        const item =
          await DharamshalaInventoryItem.findById(id);

        if (!item) {
          return buildResponse(
            DataConstant.CLIENT_ERROR.NOT_FOUND,
            "Inventory item not found"
          );
        }

        const masterItemId = await resolveItemMasterId({
          itemId: itemId || item.itemId,
          itemName,
          itemNature: "INVENTORY",
        });

        if (!masterItemId) {
          return buildResponse(
            DataConstant.CLIENT_ERROR.BAD_REQUEST,
            "A valid active inventory item master is required"
          );
        }

        item.itemId = masterItemId;
        item.itemName = itemName;
        item.category = category;
        item.unit = unit;
        item.location = location;
        item.remarks = remarks;
        item.updatedBy = updatedBy || createdBy;

        await item.save();

        return buildResponse(
          DataConstant.SUCCESS.OK,
          "Inventory item updated successfully",
          item
        );
      }

      if (!dharamshalaId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "dharamshalaId is required"
        );
      }

      const masterItemId = await resolveItemMasterId({
        itemId,
        itemName,
        itemNature: "INVENTORY",
      });

      if (!masterItemId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "A valid active inventory item master is required"
        );
      }

      const itemCode =
        await generateInventoryItemCode();

      const item =
        await DharamshalaInventoryItem.create({
          dharamshalaId,
          itemId: masterItemId,
          itemCode,
          itemName,
          category,
          unit,
          currentStock: 0,
          minimumStock: Number(minimumStock || 0),
          location,
          remarks,
          createdBy,
        });

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Inventory item added successfully",
        item
      );
    } catch (err) {
      logger.error(
        "addOrUpdateInventoryItem service error",
        {
          error: err.message,
          stack: err.stack,
          request: data,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

  exports.getAllInventoryItems =
  async (data) => {
    try {
      const {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        category,
        lowStockOnly,
        outOfStockOnly,
        searchText = "",
        statusFlag = 1,
      } = data;

      const filter = {
        statusFlag: Number(statusFlag),
      };

      if (dharamshalaId) {
        filter.dharamshalaId = dharamshalaId;
      }

      if (category) {
        filter.category = category;
      }

      if (outOfStockOnly === "true") {
        filter.currentStock = {
          $lte: 0,
        };
      }

      if (lowStockOnly === "true") {
        filter.$expr = {
          $lte: [
            "$currentStock",
            "$minimumStock",
          ],
        };
      }

      if (searchText && searchText.trim()) {
        filter.$or = [
          {
            itemCode: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
          {
            itemName: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
          {
            category: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
          {
            location: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
        ];
      }

      const skip =
        Number(pageIndex) * Number(pageSize);

      const limit = Number(pageSize);

      const totalElements =
        await DharamshalaInventoryItem.countDocuments(
          filter
        );

      const items =
        await DharamshalaInventoryItem.find(filter)
          .populate("dharamshalaId", "name")
          .populate(
            "createdBy",
            "name mobileNumber profileUrl"
          )
          .populate(
            "updatedBy",
            "name mobileNumber profileUrl"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean();

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Inventory items fetched successfully",
        {
          content: items,
          pageIndex: Number(pageIndex),
          pageSize: Number(pageSize),
          totalElements,
          totalPages: Math.ceil(
            totalElements / limit
          ),
        }
      );
    } catch (err) {
      logger.error(
        "getAllInventoryItems service error",
        {
          error: err.message,
          stack: err.stack,
          request: data,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

  exports.getInventoryItemById =
  async (id) => {
    try {
      if (!id) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Inventory item id is required"
        );
      }

      const item =
        await DharamshalaInventoryItem.findById(id)
          .populate("dharamshalaId", "name")
          .populate(
            "createdBy",
            "name mobileNumber profileUrl"
          )
          .populate(
            "updatedBy",
            "name mobileNumber profileUrl"
          )
          .lean();

      if (!item) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Inventory item not found"
        );
      }

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Inventory item fetched successfully",
        item
      );
    } catch (err) {
      logger.error(
        "getInventoryItemById service error",
        {
          error: err.message,
          stack: err.stack,
          id,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

  exports.blockUnblockInventoryItem =
  async (data) => {
    try {
      const {
        id,
        statusFlag = 1,
        updatedBy,
      } = data;

      if (!id) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Inventory item id is required"
        );
      }

      const item =
        await DharamshalaInventoryItem.findById(id);

      if (!item) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Inventory item not found"
        );
      }

      item.statusFlag = Number(statusFlag);
      item.updatedBy = updatedBy;

      await item.save();

      return buildResponse(
        DataConstant.SUCCESS.OK,
        statusFlag === 1
          ? "Inventory item activated successfully"
          : "Inventory item deactivated successfully",
        item
      );
    } catch (err) {
      logger.error(
        "blockUnblockInventoryItem service error",
        {
          error: err.message,
          stack: err.stack,
          request: data,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.updateMinimumStock = async (data) => {
  try {
    const { inventoryItemId, minimumStock, updatedBy } = data;

    if (!inventoryItemId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "inventoryItemId is required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(inventoryItemId)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid inventoryItemId"
      );
    }

    if (
      minimumStock === undefined ||
      minimumStock === null ||
      minimumStock === "" ||
      !Number.isFinite(Number(minimumStock)) ||
      Number(minimumStock) < 0
    ) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "minimumStock should be zero or greater"
      );
    }

    const item = await DharamshalaInventoryItem.findById(
      inventoryItemId
    );

    if (!item) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Inventory item not found"
      );
    }

    item.minimumStock = Number(minimumStock);
    item.updatedBy = updatedBy || item.updatedBy || null;
    await item.save();

    const currentStock = Number(item.currentStock || 0);
    const stockStatus =
      currentStock <= 0
        ? "OUT_OF_STOCK"
        : currentStock <= Number(item.minimumStock || 0)
          ? "LOW_STOCK"
          : "IN_STOCK";

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Minimum stock updated successfully",
      { item, stockStatus }
    );
  } catch (err) {
    logger.error("updateMinimumStock service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};


exports.getAllAssets = async (data) => {
  try {
    const {
      pageIndex = 0,
      pageSize = 10,
      dharamshalaId,
      assetCategory,
      condition,
      location,
      searchText = "",
      statusFlag = 1,
    } = data;

    const filter = {
      statusFlag: Number(statusFlag),
    };

    if (dharamshalaId) filter.dharamshalaId = dharamshalaId;
    if (assetCategory) filter.assetCategory = assetCategory;
    if (condition) filter.condition = condition;
    if (location) filter.location = { $regex: location, $options: "i" };

    if (searchText && searchText.trim()) {
      filter.$or = [
        { assetNumber: { $regex: searchText.trim(), $options: "i" } },
        { assetName: { $regex: searchText.trim(), $options: "i" } },
        { assetCategory: { $regex: searchText.trim(), $options: "i" } },
        { location: { $regex: searchText.trim(), $options: "i" } },
        { remarks: { $regex: searchText.trim(), $options: "i" } },
      ];
    }

    const skip = Number(pageIndex) * Number(pageSize);
    const limit = Number(pageSize);

    const totalElements = await DharamshalaAsset.countDocuments(filter);

    const assets = await DharamshalaAsset.find(filter)
      .populate("dharamshalaId", "name")
      .populate("createdBy", "name mobileNumber profileUrl")
      .populate("updatedBy", "name mobileNumber profileUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Assets fetched successfully",
      {
        content: assets,
        pageIndex: Number(pageIndex),
        pageSize: Number(pageSize),
        totalElements,
        totalPages: Math.ceil(totalElements / limit),
      }
    );
  } catch (err) {
    logger.error("getAllAssets service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

exports.getAssetById = async (id) => {
  try {
    if (!id) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "Asset id is required");
    }

    const asset = await DharamshalaAsset.findById(id)
      .populate("dharamshalaId", "name")
      .populate("expenseId", "expenseNumber title amount")
      .populate("donationId", "receiptNumber donationType amount itemName quantity")
      .populate("createdBy", "name mobileNumber profileUrl")
      .populate("updatedBy", "name mobileNumber profileUrl")
      .lean();

    if (!asset) {
      return buildResponse(DataConstant.CLIENT_ERROR.NOT_FOUND, "Asset not found");
    }

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Asset fetched successfully",
      asset
    );
  } catch (err) {
    logger.error("getAssetById service error", {
      error: err.message,
      stack: err.stack,
      id,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

exports.blockUnblockAsset = async (data) => {
  try {
    const { id, statusFlag = 1, updatedBy } = data;

    if (!id) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "Asset id is required");
    }

    const asset = await DharamshalaAsset.findById(id);

    if (!asset) {
      return buildResponse(DataConstant.CLIENT_ERROR.NOT_FOUND, "Asset not found");
    }

    asset.statusFlag = Number(statusFlag);
    asset.updatedBy = updatedBy;

    await asset.save();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      statusFlag === 1
        ? "Asset activated successfully"
        : "Asset deactivated successfully",
      asset
    );
  } catch (err) {
    logger.error("blockUnblockAsset service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};


exports.addOrUpdateAsset =
  async (data, files = {}) => {
    try {
      const {
        id,
        dharamshalaId,
        assetName,
        assetCategory,
        unit = "Piece",
        currentValue = 0,
        condition = "GOOD",
        location = "",
        remarks = "",
        createdBy,
        updatedBy,
        existingMediaUrls,
      } = data;

      if (!assetName) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "assetName is required"
        );
      }

      if (!assetCategory) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "assetCategory is required"
        );
      }

      const uploadedUrls = [];
      const mediaFiles = files?.mediaFiles || [];

      for (const file of mediaFiles) {

        
      const uploaded = await uploadToCloudinary(file.path, "inventory/assets");

      const url = uploaded?.url || "";
      if (url) {
        uploadedUrls.push(url);
      }
    }

      let oldMediaUrls = [];

      if (existingMediaUrls) {
        try {
          oldMediaUrls = JSON.parse(existingMediaUrls);
        } catch {
          oldMediaUrls = [existingMediaUrls];
        }
      }

      const imageUrls = [
        ...oldMediaUrls,
        ...uploadedUrls,
      ];

      if (id) {
        const asset =
          await DharamshalaAsset.findById(id);

        if (!asset) {
          return buildResponse(
            DataConstant.CLIENT_ERROR.NOT_FOUND,
            "Asset not found"
          );
        }

        asset.assetName = assetName;
        asset.assetCategory = assetCategory;
        asset.unit = unit;
        asset.currentValue = Number(currentValue || 0);
        asset.condition = condition;
        asset.location = location;
        asset.remarks = remarks;
        asset.imageUrls = imageUrls;
        asset.updatedBy = updatedBy || createdBy;

        await asset.save();

        return buildResponse(
          DataConstant.SUCCESS.OK,
          "Asset updated successfully",
          asset
        );
      }

      if (!dharamshalaId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "dharamshalaId is required"
        );
      }

      const assetNumber =
        await generateAssetNumber();

      const asset =
        await DharamshalaAsset.create({
          dharamshalaId,
          assetNumber,
          assetName,
          assetCategory,
          unit,
          currentValue: Number(currentValue || 0),
          condition,
          location,
          remarks,
          imageUrls,
          createdBy,
        });

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Asset added successfully",
        asset
      );
    } catch (err) {
      logger.error("addOrUpdateAsset error", {
        error: err.message,
        stack: err.stack,
        request: data,
      });

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


exports.addAssetTransaction =
  async (data) => {
    try {
      const {
        dharamshalaId,
        assetId,
        transactionType,
        quantity,
        unit = "Piece",
        rate = 0,
        amount,
        donorName = "",
        donorMobile = "",
        supplierName = "",
        transactionDate,
        expenseId = null,
        donationId = null,
        referenceNumber = "",
        remarks = "",
        createdBy,
      } = data;

      if (!dharamshalaId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "dharamshalaId is required"
        );
      }

      if (!assetId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "assetId is required"
        );
      }

      if (!transactionType) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "transactionType is required"
        );
      }

      if (!quantity || Number(quantity) <= 0) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "quantity should be greater than zero"
        );
      }

      const asset =
        await DharamshalaAsset.findById(assetId);

      if (!asset) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Asset not found"
        );
      }

      const masterItemId = await resolveItemMasterId({
        itemId: asset.itemId,
        itemName: asset.assetName,
        itemNature: "ASSET",
      });

      if (!masterItemId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Asset is not linked to an active item master"
        );
      }

      const qty = Number(quantity);
      const quantityBefore =
        Number(asset.availableQuantity || 0);

      const increaseTypes = [
        "OPENING",
        "DONATION",
        "PURCHASE",
        "TRANSFER_IN",
        "REPAIRED",
        "ADJUSTMENT_IN",
      ];

      const decreaseTypes = [
        "TRANSFER_OUT",
        "DAMAGED",
        "LOST",
        "DISPOSED",
        "ADJUSTMENT_OUT",
      ];

      let quantityAfter = quantityBefore;

      if (increaseTypes.includes(transactionType)) {
        quantityAfter = quantityBefore + qty;
        asset.totalQuantity =
          Number(asset.totalQuantity || 0) + qty;
      } else if (decreaseTypes.includes(transactionType)) {
        if (quantityBefore < qty) {
          return buildResponse(
            DataConstant.CLIENT_ERROR.BAD_REQUEST,
            "Insufficient asset quantity"
          );
        }

        quantityAfter = quantityBefore - qty;

        if (transactionType === "DAMAGED") {
          asset.damagedQuantity =
            Number(asset.damagedQuantity || 0) + qty;
        }

        if (transactionType === "LOST") {
          asset.lostQuantity =
            Number(asset.lostQuantity || 0) + qty;
        }

        if (transactionType === "DISPOSED") {
          asset.disposedQuantity =
            Number(asset.disposedQuantity || 0) + qty;
        }
      } else {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Invalid transactionType"
        );
      }

      const finalAmount =
        amount !== undefined
          ? Number(amount || 0)
          : Number(rate || 0) * qty;

      const transactionNumber =
        await generateAssetTransactionNumber();

      const transaction =
        await DharamshalaAssetTransaction.create({
          dharamshalaId,
          itemId: masterItemId,
          assetId,
          transactionNumber,
          transactionType,
          quantity: qty,
          unit,
          rate: Number(rate || 0),
          amount: finalAmount,
          quantityBefore,
          quantityAfter,
          donorName,
          donorMobile,
          supplierName,
          transactionDate: transactionDate || new Date(),
          expenseId,
          donationId,
          referenceNumber,
          remarks,
          createdBy,
        });

      asset.availableQuantity = quantityAfter;
      asset.itemId = masterItemId;
      asset.unit = unit;
      asset.totalPurchaseCost =
        Number(asset.totalPurchaseCost || 0) +
        (["PURCHASE", "OPENING"].includes(transactionType)
          ? finalAmount
          : 0);
      asset.updatedBy = createdBy;

      await asset.save();

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Asset transaction added successfully",
        transaction
      );
    } catch (err) {
      logger.error("addAssetTransaction error", {
        error: err.message,
        stack: err.stack,
        request: data,
      });

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getAssetTransactions =
  async (data) => {
    try {
      const {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        assetId,
        transactionType,
        searchText = "",
        statusFlag = 1,
      } = data;

      const filter = {
        statusFlag: Number(statusFlag),
      };

      if (dharamshalaId) filter.dharamshalaId = dharamshalaId;
      if (assetId) filter.assetId = assetId;
      if (transactionType) filter.transactionType = transactionType;

      if (searchText && searchText.trim()) {
        filter.$or = [
          {
            transactionNumber: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
          {
            donorName: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
          {
            supplierName: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
          {
            referenceNumber: {
              $regex: searchText.trim(),
              $options: "i",
            },
          },
        ];
      }

      const skip =
        Number(pageIndex) * Number(pageSize);

      const limit = Number(pageSize);

      const totalElements =
        await DharamshalaAssetTransaction.countDocuments(
          filter
        );

      const transactions =
        await DharamshalaAssetTransaction.find(filter)
          .populate("assetId", "assetNumber assetName assetCategory unit")
          .populate("createdBy", "name mobileNumber profileUrl")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Asset transactions fetched successfully",
        {
          content: transactions,
          pageIndex: Number(pageIndex),
          pageSize: Number(pageSize),
          totalElements,
          totalPages: Math.ceil(totalElements / limit),
        }
      );
    } catch (err) {
      logger.error("getAssetTransactions error", {
        error: err.message,
        stack: err.stack,
        request: data,
      });

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };
