const DharamshalaDonation = require("../models/DharamshalaDonation");
const DharamshalaExpense = require("../models/DharamshalaExpense");
const DharamshalaExpenseItem = require("../models/DharamshalaExpenseItem");

const DharamshalaItem = require("../models/DharamshalaItem");

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

const getItemMaster = async (itemId) => {
  if (!itemId) return null;

  return DharamshalaItem.findOne({
    _id: itemId,
    statusFlag: 1,
  }).lean();
};

const findOrCreateAsset = async ({ dharamshalaId, itemMaster, createdBy }) => {
  let asset = await DharamshalaAsset.findOne({
    dharamshalaId,
    itemId: itemMaster._id,
    statusFlag: 1,
  });

  if (asset) return asset;

  const assetNumber = await generateAssetNumber();

  asset = await DharamshalaAsset.create({
    dharamshalaId,
    itemId: itemMaster._id,
    assetNumber,
    assetName: itemMaster.itemName,
    assetCategory: itemMaster.category || "OTHER",
    totalQuantity: 0,
    availableQuantity: 0,
    damagedQuantity: 0,
    lostQuantity: 0,
    disposedQuantity: 0,
    unit: itemMaster.defaultUnit || "Piece",
    totalPurchaseCost: 0,
    currentValue: 0,
    condition: "GOOD",
    location: "",
    imageUrls: [],
    remarks: "Auto-created from item sync",
    createdBy,
  });

  return asset;
};

const findOrCreateInventoryItem = async ({
  dharamshalaId,
  itemMaster,
  createdBy,
}) => {
  let item = await DharamshalaInventoryItem.findOne({
    dharamshalaId,
    itemId: itemMaster._id,
    statusFlag: 1,
  });

  if (item) return item;

  const itemCode = await generateInventoryItemCode();

  item = await DharamshalaInventoryItem.create({
    dharamshalaId,
    itemId: itemMaster._id,
    itemCode,
    itemName: itemMaster.itemName,
    category: itemMaster.category,
    unit: itemMaster.defaultUnit || "Piece",
    currentStock: 0,
    minimumStock: 0,
    location: "",
    remarks: "Auto-created from item sync",
    createdBy,
  });

  return item;
};

const createAssetTransaction = async ({
  dharamshalaId,
  itemMaster,
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
    itemId: itemMaster._id,
    assetId: asset._id,
    transactionNumber,
    transactionType,
    quantity: qty,
    unit: unit || asset.unit || itemMaster.defaultUnit || "Piece",
    rate: Number(rate || 0),
    amount: Number(amount || 0),
    quantityBefore,
    quantityAfter,
    sourceType: donationId ? "DONATION" : expenseId ? "EXPENSE" : "MANUAL",
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
  asset.unit = unit || asset.unit || itemMaster.defaultUnit || "Piece";

  if (transactionType === "PURCHASE") {
    asset.totalPurchaseCost =
      Number(asset.totalPurchaseCost || 0) + Number(amount || 0);

    asset.currentValue =
      Number(asset.currentValue || 0) + Number(amount || 0);
  }

  asset.updatedBy = createdBy;
  await asset.save();

  return transaction;
};

const createStockTransaction = async ({
  dharamshalaId,
  itemMaster,
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
    itemId: itemMaster._id,
    inventoryItemId: item._id,
    transactionNumber,
    transactionType,
    quantity: qty,
    unit: unit || item.unit || itemMaster.defaultUnit || "Piece",
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
  item.unit = unit || item.unit || itemMaster.defaultUnit || "Piece";
  item.updatedBy = createdBy;
  await item.save();

  return transaction;
};

exports.syncDonationItemToAssetOrInventory = async (donationId) => {
  try {
    if (!donationId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "donationId is required"
      );
    }

    const donation = await DharamshalaDonation.findById(donationId).lean();

    if (!donation) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Donation not found"
      );
    }

    if (donation.donationType !== "ITEM") {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Only ITEM donation can be synced"
      );
    }

    if (!donation.itemId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "itemId is required in donation. Please select Dharamshala item."
      );
    }

    const itemMaster = await getItemMaster(donation.itemId);

    if (!itemMaster) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Dharamshala item not found"
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
        DataConstant.CLIENT_ERROR.CONFLICT,
        "Donation already synced",
        alreadyAssetTxn || alreadyStockTxn
      );
    }

    const quantity = Number(donation.receivedQuantity || donation.quantity || 1);
    const rate = Number(donation.price || 0);
    const amount = Number((quantity * rate).toFixed(2));
    const unit = donation.unit || itemMaster.defaultUnit || "Piece";
    const dharamshalaId = donation.dharamshalaId;
    const createdBy =
      donation.updatedBy || donation.createdBy || donation.collectedBy;

    if (itemMaster.itemNature === "ASSET") {
      const asset = await findOrCreateAsset({
        dharamshalaId,
        itemMaster,
        createdBy,
      });

      const transaction = await createAssetTransaction({
        dharamshalaId,
        itemMaster,
        asset,
        transactionType: "DONATION",
        quantity,
        unit,
        rate,
        amount,
        donationId,
        donorName: donation.externalDonorName || "",
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
      itemMaster,
      createdBy,
    });

    const transaction = await createStockTransaction({
      dharamshalaId,
      itemMaster,
      item: inventoryItem,
      transactionType: "DONATION",
      quantity,
      unit,
      rate,
      amount,
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

exports.syncExpenseItemToAssetOrInventory = async (expenseId) => {
  try {
    if (!expenseId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "expenseId is required"
      );
    }

    const expense = await DharamshalaExpense.findById(expenseId).lean();

    if (!expense) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Expense not found"
      );
    }

    const expenseItems = await DharamshalaExpenseItem.find({
      expenseId,
    }).lean();

    if (!expenseItems.length) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
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
        DataConstant.CLIENT_ERROR.CONFLICT,
        "Expense already synced",
        alreadyAssetTxn || alreadyStockTxn
      );
    }

    const synced = [];

    for (const expenseItem of expenseItems) {
      if (!expenseItem.itemId) {
        synced.push({
          type: "SKIPPED",
          itemName: expenseItem.itemName,
          reason: "itemId missing in expense item",
        });
        continue;
      }

      const itemMaster = await getItemMaster(expenseItem.itemId);

      if (!itemMaster) {
        synced.push({
          type: "SKIPPED",
          itemName: expenseItem.itemName,
          reason: "Dharamshala item not found",
        });
        continue;
      }

      if (itemMaster.itemNature === "ASSET") {
        const asset = await findOrCreateAsset({
          dharamshalaId: expense.dharamshalaId,
          itemMaster,
          createdBy: expense.createdBy,
        });

        const transaction = await createAssetTransaction({
          dharamshalaId: expense.dharamshalaId,
          itemMaster,
          asset,
          transactionType: "PURCHASE",
          quantity: expenseItem.quantity || 1,
          unit:
            expenseItem.unit ||
            itemMaster.defaultUnit ||
            "Piece",
          rate: expenseItem.rate || 0,
          amount: expenseItem.amount || expense.amount || 0,
          expenseId,
          supplierName: expense.vendorName || "",
          referenceNumber: expense.expenseNumber || expense.billNumber || "",
          remarks: `Auto synced from expense ${expense.expenseNumber || ""}`,
          createdBy: expense.createdBy,
        });

        synced.push({
          type: "ASSET",
          itemName: itemMaster.itemName,
          transaction,
        });
      } else {
        const inventoryItem = await findOrCreateInventoryItem({
          dharamshalaId: expense.dharamshalaId,
          itemMaster,
          createdBy: expense.createdBy,
        });

        const transaction = await createStockTransaction({
          dharamshalaId: expense.dharamshalaId,
          itemMaster,
          item: inventoryItem,
          transactionType: "PURCHASE",
          quantity: expenseItem.quantity || 1,
          unit:
            expenseItem.unit ||
            itemMaster.defaultUnit ||
            "Piece",
          rate: expenseItem.rate || 0,
          amount: expenseItem.amount || 0,
          expenseId,
          referenceNumber: expense.expenseNumber || expense.billNumber || "",
          remarks: `Auto synced from expense ${expense.expenseNumber || ""}`,
          createdBy: expense.createdBy,
        });

        synced.push({
          type: "INVENTORY",
          itemName: itemMaster.itemName,
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
