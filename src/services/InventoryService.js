const DharamshalaAsset =
  require("../models/DharamshalaAsset");

const DharamshalaInventoryItem =
  require("../models/DharamshalaInventoryItem");

const DharamshalaInventoryTransaction =
  require("../models/DharamshalaInventoryTransaction");


const {
  generateAssetNumber,
  generateInventoryItemCode,
  generateStockTransactionNumber,
} = require("../utils/NumberGenerater");

const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );

const  buildResponse  = require("../utils/response");
const DataConstant = require("../constants/DataConstant");
const logger = require("../utils/logger");




exports.addStockTransaction = async (data) => {
  try {
    const {
      dharamshalaId,
      inventoryItemId,
      transactionType,
      quantity,
      unit = "Piece",
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
        DataConstant.BAD_REQUEST,
        "dharamshalaId is required"
      );
    }

    if (!inventoryItemId) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "inventoryItemId is required"
      );
    }

    if (!transactionType) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "transactionType is required"
      );
    }

    if (!quantity || Number(quantity) <= 0) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "quantity should be greater than zero"
      );
    }

    const item =
      await DharamshalaInventoryItem.findById(inventoryItemId);

    if (!item) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        "Inventory item not found"
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
          DataConstant.BAD_REQUEST,
          "Insufficient stock"
        );
      }

      stockAfter = stockBefore - qty;
    } else {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid transactionType"
      );
    }

    const transactionNumber =
      await generateStockTransactionNumber();

    const finalAmount =
      amount !== undefined
        ? Number(amount || 0)
        : Number(rate || 0) * qty;

    const transaction =
      await DharamshalaInventoryTransaction.create({
        dharamshalaId,
        inventoryItemId,
        transactionNumber,
        transactionType,
        quantity: qty,
        unit,
        rate: Number(rate || 0),
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
        DataConstant.BAD_REQUEST,
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
        DataConstant.NOT_FOUND,
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
        itemName,
        category,
        unit = "Piece",
        currentStock = 0,
        minimumStock = 0,
        location = "",
        remarks = "",
        createdBy,
        updatedBy,
      } = data;

      if (!itemName) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "itemName is required"
        );
      }

      if (!category) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "category is required"
        );
      }

      if (id) {
        const item =
          await DharamshalaInventoryItem.findById(id);

        if (!item) {
          return buildResponse(
            DataConstant.NOT_FOUND,
            "Inventory item not found"
          );
        }

        item.itemName = itemName;
        item.category = category;
        item.unit = unit;
        item.currentStock = Number(currentStock || 0);
        item.minimumStock = Number(minimumStock || 0);
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
          DataConstant.BAD_REQUEST,
          "dharamshalaId is required"
        );
      }

      const itemCode =
        await generateInventoryItemCode();

      const item =
        await DharamshalaInventoryItem.create({
          dharamshalaId,
          itemCode,
          itemName,
          category,
          unit,
          currentStock: Number(currentStock || 0),
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
          DataConstant.BAD_REQUEST,
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
          DataConstant.NOT_FOUND,
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
          DataConstant.BAD_REQUEST,
          "Inventory item id is required"
        );
      }

      const item =
        await DharamshalaInventoryItem.findById(id);

      if (!item) {
        return buildResponse(
          DataConstant.NOT_FOUND,
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
exports.addAsset = async (data) => {
  try {
    const {
      dharamshalaId,
      assetName,
      assetCategory,
      sourceType,
      donorName = "",
      donorMobile = "",
      supplierName = "",
      quantity = 1,
      unit = "Piece",
      purchaseCost = 0,
      currentValue = 0,
      purchaseDate,
      donationDate,
      condition = "GOOD",
      location = "",
      expenseId = null,
      donationId = null,
      imageUrls = [],
      remarks = "",
      createdBy,
    } = data;

    if (!dharamshalaId) {
      return buildResponse(DataConstant.BAD_REQUEST, "dharamshalaId is required");
    }

    if (!assetName) {
      return buildResponse(DataConstant.BAD_REQUEST, "assetName is required");
    }

    if (!assetCategory) {
      return buildResponse(DataConstant.BAD_REQUEST, "assetCategory is required");
    }

    if (!sourceType) {
      return buildResponse(DataConstant.BAD_REQUEST, "sourceType is required");
    }

    const assetNumber = await generateAssetNumber();

    const asset = await DharamshalaAsset.create({
      dharamshalaId,
      assetNumber,
      assetName,
      assetCategory,
      sourceType,
      donorName,
      donorMobile,
      supplierName,
      quantity,
      unit,
      purchaseCost,
      currentValue,
      purchaseDate: purchaseDate || null,
      donationDate: donationDate || null,
      condition,
      location,
      expenseId,
      donationId,
      imageUrls,
      remarks,
      createdBy,
    });

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Asset added successfully",
      asset
    );
  } catch (err) {
    logger.error("addAsset service error", {
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
      sourceType,
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
    if (sourceType) filter.sourceType = sourceType;
    if (condition) filter.condition = condition;
    if (location) filter.location = { $regex: location, $options: "i" };

    if (searchText && searchText.trim()) {
      filter.$or = [
        { assetNumber: { $regex: searchText.trim(), $options: "i" } },
        { assetName: { $regex: searchText.trim(), $options: "i" } },
        { donorName: { $regex: searchText.trim(), $options: "i" } },
        { donorMobile: { $regex: searchText.trim(), $options: "i" } },
        { supplierName: { $regex: searchText.trim(), $options: "i" } },
        { location: { $regex: searchText.trim(), $options: "i" } },
      ];
    }

    const skip = Number(pageIndex) * Number(pageSize);
    const limit = Number(pageSize);

    const totalElements = await DharamshalaAsset.countDocuments(filter);

    const assets = await DharamshalaAsset.find(filter)
      .populate("dharamshalaId", "name")
      .populate("expenseId", "expenseNumber title amount")
      .populate("donationId", "receiptNumber donationType amount itemName quantity")
      .populate("createdBy", "name mobileNumber profileUrl")
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
      return buildResponse(DataConstant.BAD_REQUEST, "Asset id is required");
    }

    const asset = await DharamshalaAsset.findById(id)
      .populate("dharamshalaId", "name")
      .populate("expenseId", "expenseNumber title amount")
      .populate("donationId", "receiptNumber donationType amount itemName quantity")
      .populate("createdBy", "name mobileNumber profileUrl")
      .populate("updatedBy", "name mobileNumber profileUrl")
      .lean();

    if (!asset) {
      return buildResponse(DataConstant.NOT_FOUND, "Asset not found");
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

exports.updateAsset = async (id, data) => {
  try {
    if (!id) {
      return buildResponse(DataConstant.BAD_REQUEST, "Asset id is required");
    }

    const asset = await DharamshalaAsset.findById(id);

    if (!asset) {
      return buildResponse(DataConstant.NOT_FOUND, "Asset not found");
    }

    const allowedFields = [
      "assetName",
      "assetCategory",
      "sourceType",
      "donorName",
      "donorMobile",
      "supplierName",
      "quantity",
      "unit",
      "purchaseCost",
      "currentValue",
      "purchaseDate",
      "donationDate",
      "condition",
      "location",
      "imageUrls",
      "remarks",
      "updatedBy",
    ];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        asset[field] = data[field];
      }
    });

    await asset.save();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Asset updated successfully",
      asset
    );
  } catch (err) {
    logger.error("updateAsset service error", {
      error: err.message,
      stack: err.stack,
      id,
      request: data,
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
      return buildResponse(DataConstant.BAD_REQUEST, "Asset id is required");
    }

    const asset = await DharamshalaAsset.findById(id);

    if (!asset) {
      return buildResponse(DataConstant.NOT_FOUND, "Asset not found");
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


exports.addOrUpdateAsset = async (data, files = {}) => {
  try {
    const {
      id,
      dharamshalaId,
      assetName,
      assetCategory,
      sourceType,
      donorName = "",
      donorMobile = "",
      supplierName = "",
      quantity = 1,
      unit = "Piece",
      purchaseCost = 0,
      currentValue = 0,
      purchaseDate,
      donationDate,
      condition = "GOOD",
      location = "",
      expenseId = null,
      donationId = null,
      remarks = "",
      createdBy,
      updatedBy,
      existingMediaUrls,
    } = data;

    if (!assetName) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "assetName is required"
      );
    }

    if (!assetCategory) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "assetCategory is required"
      );
    }

    if (!sourceType) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "sourceType is required"
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
      if (Array.isArray(existingMediaUrls)) {
        oldMediaUrls = existingMediaUrls;
      } else {
        try {
          oldMediaUrls = JSON.parse(existingMediaUrls);
        } catch {
          oldMediaUrls = [existingMediaUrls];
        }
      }
    }

    const mediaUrls = [
      ...oldMediaUrls,
      ...uploadedUrls,
    ];

    if (id) {
      const asset = await DharamshalaAsset.findById(id);

      if (!asset) {
        return buildResponse(
          DataConstant.NOT_FOUND,
          "Asset not found"
        );
      }

      asset.assetName = assetName;
      asset.assetCategory = assetCategory;
      asset.sourceType = sourceType;
      asset.donorName = donorName;
      asset.donorMobile = donorMobile;
      asset.supplierName = supplierName;
      asset.quantity = Number(quantity || 1);
      asset.unit = unit;
      asset.purchaseCost = Number(purchaseCost || 0);
      asset.currentValue = Number(currentValue || 0);
      asset.purchaseDate = purchaseDate || null;
      asset.donationDate = donationDate || null;
      asset.condition = condition;
      asset.location = location;
      asset.expenseId = expenseId || null;
      asset.donationId = donationId || null;
      asset.imageUrls = mediaUrls;
      asset.remarks = remarks;
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
        DataConstant.BAD_REQUEST,
        "dharamshalaId is required"
      );
    }

    const assetNumber = await generateAssetNumber();

    const asset = await DharamshalaAsset.create({
      dharamshalaId,
      assetNumber,
      assetName,
      assetCategory,
      sourceType,
      donorName,
      donorMobile,
      supplierName,
      quantity: Number(quantity || 1),
      unit,
      purchaseCost: Number(purchaseCost || 0),
      currentValue: Number(currentValue || 0),
      purchaseDate: purchaseDate || null,
      donationDate: donationDate || null,
      condition,
      location,
      expenseId: expenseId || null,
      donationId: donationId || null,
      imageUrls: mediaUrls,
      remarks,
      createdBy,
    });

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Asset added successfully",
      asset
    );
  } catch (err) {
    logger.error("addOrUpdateAsset service error", {
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