const mongoose = require("mongoose");

const DharamshalaDonation = require("../models/DharamshalaDonation");
const DharamshalaExpense = require("../models/DharamshalaExpense");
const DharamshalaExpenseItem = require("../models/DharamshalaExpenseItem");

const DharamshalaAsset = require("../models/DharamshalaAsset");
const DharamshalaAssetTransaction = require("../models/DharamshalaAssetTransaction");

const DharamshalaInventoryItem = require("../models/DharamshalaInventoryItem");
const DharamshalaInventoryTransaction = require("../models/DharamshalaInventoryTransaction");

const {
  generateAssetNumber,
  generateInventoryItemCode,
  generateAssetTransactionNumber,
  generateStockTransactionNumber,
} = require("../utils/NumberGenerater");

const buildResponse = require("../utils/response");
const DataConstant = require("../constants/DataConstant");
const logger = require("../utils/logger");

/**
 * Decide item should be ASSET or INVENTORY
 */
const decideItemNature = (itemName = "", category = "") => {
  const text = `${itemName} ${category}`.toLowerCase();

  const assetKeywords = [
    "fan",
    "chair",
    "table",
    "bed",
    "cooler",
    "light",
    "bulb holder",
    "water tank",
    "motor",
    "cctv",
    "camera",
    "speaker",
    "mic",
    "mike",
    "utensil",
    "kadai",
    "patila",
    "gas stove",
    "fridge",
    "almirah",
    "mattress",
  ];

  const inventoryKeywords = [
    "rice",
    "wheat",
    "oil",
    "sugar",
    "tea",
    "cement",
    "paint",
    "sand",
    "brick",
    "wire",
    "pipe",
    "phenyl",
    "soap",
    "cleaning",
    "disposable",
    "food",
    "grocery",
  ];

  if (assetKeywords.some((word) => text.includes(word))) {
    return "ASSET";
  }

  if (inventoryKeywords.some((word) => text.includes(word))) {
    return "INVENTORY";
  }

  return "ASSET";
};

const mapAssetCategory = (itemName = "", category = "") => {
  const text = `${itemName} ${category}`.toLowerCase();

  if (text.includes("fan") || text.includes("light") || text.includes("bulb")) {
    return "ELECTRICAL";
  }

  if (text.includes("chair") || text.includes("table")) {
    return "FURNITURE";
  }

  if (text.includes("bed") || text.includes("mattress")) {
    return "BEDDING";
  }

  if (
    text.includes("kitchen") ||
    text.includes("kadai") ||
    text.includes("patila") ||
    text.includes("stove")
  ) {
    return "KITCHEN";
  }

  if (text.includes("water")) {
    return "WATER_SYSTEM";
  }

  if (text.includes("cement") || text.includes("brick") || text.includes("sand")) {
    return "CONSTRUCTION_MATERIAL";
  }

  return "OTHER";
};

const mapInventoryCategory = (itemName = "", category = "") => {
  const text = `${itemName} ${category}`.toLowerCase();

  if (
    text.includes("rice") ||
    text.includes("wheat") ||
    text.includes("oil") ||
    text.includes("sugar") ||
    text.includes("tea")
  ) {
    return "FOOD";
  }

  if (text.includes("cement") || text.includes("paint") || text.includes("brick")) {
    return "CONSTRUCTION";
  }

  if (text.includes("phenyl") || text.includes("soap") || text.includes("clean")) {
    return "CLEANING";
  }

  if (text.includes("wire") || text.includes("bulb")) {
    return "ELECTRICAL";
  }

  return "OTHER";
};

const normalizeName = (name = "") => name.trim().replace(/\s+/g, " ");

const findOrCreateAsset = async ({
  dharamshalaId,
  itemName,
  unit,
  currentValue = 0,
  createdBy,
}) => {
  const assetName = normalizeName(itemName);

  let asset = await DharamshalaAsset.findOne({
    dharamshalaId,
    assetName: { $regex: `^${assetName}$`, $options: "i" },
    statusFlag: 1,
  });

  if (asset) return asset;

  const assetNumber = await generateAssetNumber();

  asset = await DharamshalaAsset.create({
    dharamshalaId,
    assetNumber,
    assetName,
    assetCategory: mapAssetCategory(assetName),
    unit: unit || "Piece",
    totalQuantity: 0,
    availableQuantity: 0,
    damagedQuantity: 0,
    lostQuantity: 0,
    disposedQuantity: 0,
    currentValue: Number(currentValue || 0),
    condition: "GOOD",
    location: "",
    remarks: "Auto-created from finance sync",
    createdBy,
  });

  return asset;
};

const findOrCreateInventoryItem = async ({
  dharamshalaId,
  itemName,
  unit,
  currentStock = 0,
  createdBy,
}) => {
  const cleanName = normalizeName(itemName);

  let item = await DharamshalaInventoryItem.findOne({
    dharamshalaId,
    itemName: { $regex: `^${cleanName}$`, $options: "i" },
    statusFlag: 1,
  });

  if (item) return item;

  const itemCode = await generateInventoryItemCode();

  item = await DharamshalaInventoryItem.create({
    dharamshalaId,
    itemCode,
    itemName: cleanName,
    category: mapInventoryCategory(cleanName),
    unit: unit || "Piece",
    currentStock: Number(currentStock || 0),
    minimumStock: 0,
    location: "",
    remarks: "Auto-created from finance sync",
    createdBy,
  });

  return item;
};

const createAssetTransaction = async ({
  dharamshalaId,
  asset,
  transactionType,
  quantity,
  unit,
  rate = 0,
  amount = 0,
  donationId = null,
  expenseId = null,
  donorName = "",
  donorMobile = "",
  supplierName = "",
  referenceNumber = "",
  remarks = "",
  createdBy,
}) => {
  const qty = Number(quantity || 0);
  const quantityBefore = Number(asset.availableQuantity || 0);
  const quantityAfter = quantityBefore + qty;

  const transactionNumber = await generateAssetTransactionNumber();

  const transaction = await DharamshalaAssetTransaction.create({
    dharamshalaId,
    assetId: asset._id,
    transactionNumber,
    transactionType,
    quantity: qty,
    unit: unit || asset.unit || "Piece",
    rate: Number(rate || 0),
    amount: Number(amount || 0),
    quantityBefore,
    quantityAfter,
    donationId,
    expenseId,
    donorName,
    donorMobile,
    supplierName,
    referenceNumber,
    remarks,
    createdBy,
  });

  asset.totalQuantity = Number(asset.totalQuantity || 0) + qty;
  asset.availableQuantity = quantityAfter;
  asset.unit = unit || asset.unit || "Piece";

  if (transactionType === "PURCHASE") {
    asset.totalPurchaseCost = Number(asset.totalPurchaseCost || 0) + Number(amount || 0);
  }

  asset.updatedBy = createdBy;
  await asset.save();

  return transaction;
};

const createStockTransaction = async ({
  dharamshalaId,
  item,
  transactionType,
  quantity,
  unit,
  rate = 0,
  amount = 0,
  donationId = null,
  expenseId = null,
  referenceNumber = "",
  remarks = "",
  createdBy,
}) => {
  const qty = Number(quantity || 0);
  const stockBefore = Number(item.currentStock || 0);
  const stockAfter = stockBefore + qty;

  const transactionNumber = await generateStockTransactionNumber();

  const transaction = await DharamshalaInventoryTransaction.create({
    dharamshalaId,
    inventoryItemId: item._id,
    transactionNumber,
    transactionType,
    quantity: qty,
    unit: unit || item.unit || "Piece",
    rate: Number(rate || 0),
    amount: Number(amount || 0),
    stockBefore,
    stockAfter,
    sourceType: donationId ? "DONATION" : expenseId ? "EXPENSE" : "MANUAL",
    donationId,
    expenseId,
    referenceNumber,
    remarks,
    createdBy,
  });

  item.currentStock = stockAfter;
  item.unit = unit || item.unit || "Piece";
  item.updatedBy = createdBy;
  await item.save();

  return transaction;
};

/**
 * Donation ITEM sync
 */
exports.syncDonationItemToAssetOrInventory = async (donationId) => {
  try {
    if (!donationId) {
      return buildResponse(DataConstant.BAD_REQUEST, "donationId is required");
    }

    const donation = await DharamshalaDonation.findById(donationId).lean();

    if (!donation) {
      return buildResponse(DataConstant.NOT_FOUND, "Donation not found");
    }

    if (donation.donationType !== "ITEM") {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Only ITEM donation can be synced"
      );
    }

    const alreadyAssetTxn = await DharamshalaAssetTransaction.findOne({
      donationId,
      statusFlag: 1,
    }).lean();

    const alreadyStockTxn = await DharamshalaInventoryTransaction.findOne({
      donationId,
      statusFlag: 1,
    }).lean();

    if (alreadyAssetTxn || alreadyStockTxn) {
      return buildResponse(
        DataConstant.CONFLICT,
        "Donation already synced",
        alreadyAssetTxn || alreadyStockTxn
      );
    }

    const itemName = donation.itemName;
    const quantity = Number(
  donation.receivedQuantity || donation.quantity || 1
);
    const unit = donation.unit || "Piece";
    const dharamshalaId = donation.dharamshalaId;
    const createdBy = donation.createdBy || donation.collectedBy;

    if (!itemName) {
      return buildResponse(DataConstant.BAD_REQUEST, "Donation itemName missing");
    }

    const nature = decideItemNature(itemName);

    if (nature === "ASSET") {
      const asset = await findOrCreateAsset({
        dharamshalaId,
        itemName,
        unit,
        createdBy,
      });

      const transaction = await createAssetTransaction({
        dharamshalaId,
        asset,
        transactionType: "DONATION",
        quantity,
        unit,
        amount: 0,
        donationId,
        donorName:
          donation.externalDonorName ||
          donation.donorUserId?.name ||
          "",
        donorMobile: donation.externalMobileNumber || "",
        referenceNumber: donation.receiptNumber || "",
        remarks: `Auto synced from donation ${donation.receiptNumber || ""}`,
        createdBy,
      });

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Donation synced to asset successfully",
        transaction
      );
    }

    const inventoryItem = await findOrCreateInventoryItem({
      dharamshalaId,
      itemName,
      unit,
      createdBy,
    });

    const transaction = await createStockTransaction({
      dharamshalaId,
      item: inventoryItem,
      transactionType: "DONATION",
      quantity,
      unit,
      amount: 0,
      donationId,
      referenceNumber: donation.receiptNumber || "",
      remarks: `Auto synced from donation ${donation.receiptNumber || ""}`,
      createdBy,
    });

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Donation synced to inventory successfully",
      transaction
    );
  } catch (err) {
    logger.error("syncDonationItemToAssetOrInventory error", {
      error: err.message,
      stack: err.stack,
      donationId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};

/**
 * Expense items sync
 */
exports.syncExpenseItemToAssetOrInventory = async (expenseId) => {
  try {
    if (!expenseId) {
      return buildResponse(DataConstant.BAD_REQUEST, "expenseId is required");
    }

    const expense = await DharamshalaExpense.findById(expenseId).lean();

    if (!expense) {
      return buildResponse(DataConstant.NOT_FOUND, "Expense not found");
    }

    const expenseItems = await DharamshalaExpenseItem.find({
      expenseId,
    }).lean();

    if (!expenseItems.length) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "No expense items found"
      );
    }

    const alreadyAssetTxn = await DharamshalaAssetTransaction.findOne({
      expenseId,
      statusFlag: 1,
    }).lean();

    const alreadyStockTxn = await DharamshalaInventoryTransaction.findOne({
      expenseId,
      statusFlag: 1,
    }).lean();

    if (alreadyAssetTxn || alreadyStockTxn) {
      return buildResponse(
        DataConstant.CONFLICT,
        "Expense already synced",
        alreadyAssetTxn || alreadyStockTxn
      );
    }

    const synced = [];

    for (const item of expenseItems) {
      const nature = decideItemNature(item.itemName, item.itemType);

      if (nature === "ASSET") {
        const asset = await findOrCreateAsset({
          dharamshalaId: expense.dharamshalaId,
          itemName: item.itemName,
          unit: item.unit,
          currentValue: item.amount,
          createdBy: expense.createdBy,
        });

        const transaction = await createAssetTransaction({
          dharamshalaId: expense.dharamshalaId,
          asset,
          transactionType: "PURCHASE",
          quantity: item.quantity || 1,
          unit: item.unit || "Piece",
          rate: item.rate || 0,
          amount: item.amount || expense.amount || 0,
          expenseId,
          supplierName: expense.vendorName || "",
          referenceNumber: expense.expenseNumber || expense.billNumber || "",
          remarks: `Auto synced from expense ${expense.expenseNumber || ""}`,
          createdBy: expense.createdBy,
        });

        synced.push({
          type: "ASSET",
          itemName: item.itemName,
          transaction,
        });
      } else {
        const inventoryItem = await findOrCreateInventoryItem({
          dharamshalaId: expense.dharamshalaId,
          itemName: item.itemName,
          unit: item.unit,
          createdBy: expense.createdBy,
        });

        const transaction = await createStockTransaction({
          dharamshalaId: expense.dharamshalaId,
          item: inventoryItem,
          transactionType: "PURCHASE",
          quantity: item.quantity || 1,
          unit: item.unit || "Piece",
          rate: item.rate || 0,
          amount: item.amount || 0,
          expenseId,
          referenceNumber: expense.expenseNumber || expense.billNumber || "",
          remarks: `Auto synced from expense ${expense.expenseNumber || ""}`,
          createdBy: expense.createdBy,
        });

        synced.push({
          type: "INVENTORY",
          itemName: item.itemName,
          transaction,
        });
      }
    }

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Expense synced successfully",
      synced
    );
  } catch (err) {
    logger.error("syncExpenseItemToAssetOrInventory error", {
      error: err.message,
      stack: err.stack,
      expenseId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};