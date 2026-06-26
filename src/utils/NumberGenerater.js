const DharamshalaDonation =
  require("../models/DharamshalaDonation");

const DharamshalaVoucher =
  require("../models/DharamshalaVoucher");

const DharamshalaLedger =
  require("../models/DharamshalaLedger");

const DharamshalaExpense = require("../models/DharamshalaExpense");

const DharamshalaAsset = require("../models/DharamshalaAsset");
const DharamshalaInventoryItem = require("../models/DharamshalaInventoryItem");
const DharamshalaInventoryTransaction = require("../models/DharamshalaInventoryTransaction")

/**
 * Format:
 * DR-2026-06-00001
 * VCH-2026-06-00001
 * LED-2026-06-00001
 */

function getYearMonth() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  return {
    year,
    month,
  };
}

async function generateReceiptNumber() {
  const { year, month } =
    getYearMonth();

  const count =
    await DharamshalaDonation.countDocuments();

  return `DR-${year}-${month}-${String(
    count + 1
  ).padStart(5, "0")}`;
}

async function generateVoucherNumber() {
  const { year, month } =
    getYearMonth();

  const count =
    await DharamshalaVoucher.countDocuments();

  return `VCH-${year}-${month}-${String(
    count + 1
  ).padStart(5, "0")}`;
}

async function generateLedgerNumber() {
  const { year, month } =
    getYearMonth();

  const count =
    await DharamshalaLedger.countDocuments();

  return `LED-${year}-${month}-${String(
    count + 1
  ).padStart(5, "0")}`;
}

async function generateExpenseNumber() {

  const { year, month } =
    getYearMonth();
  const count =
    await DharamshalaExpense.countDocuments();

  return `EXP-${year}-${month}-${String(
    count + 1
  ).padStart(5, "0")}`;
}


function padNumber(number) {
  return String(number).padStart(5, "0");
}

async function generateAssetNumber() {
  const { year, month } = getYearMonth();

  const prefix = `AST-${year}-${month}-`;

  const lastAsset = await DharamshalaAsset.findOne({
    assetNumber: {
      $regex: `^${prefix}`,
    },
  })
    .sort({
      createdAt: -1,
    })
    .select("assetNumber")
    .lean();

  let nextNumber = 1;

  if (lastAsset?.assetNumber) {
    const lastNumber = Number(lastAsset.assetNumber.split("-").pop());

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${padNumber(nextNumber)}`;
}

async function generateInventoryItemCode() {
  const { year, month } = getYearMonth();

  const prefix = `INV-${year}-${month}-`;

  const lastItem = await DharamshalaInventoryItem.findOne({
    itemCode: {
      $regex: `^${prefix}`,
    },
  })
    .sort({
      createdAt: -1,
    })
    .select("itemCode")
    .lean();

  let nextNumber = 1;

  if (lastItem?.itemCode) {
    const lastNumber = Number(lastItem.itemCode.split("-").pop());

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${padNumber(nextNumber)}`;
}

async function generateStockTransactionNumber() {
  const { year, month } = getYearMonth();

  const prefix = `STK-${year}-${month}-`;

  const lastTransaction =
    await DharamshalaInventoryTransaction.findOne({
      transactionNumber: {
        $regex: `^${prefix}`,
      },
    })
      .sort({
        createdAt: -1,
      })
      .select("transactionNumber")
      .lean();

  let nextNumber = 1;

  if (lastTransaction?.transactionNumber) {
    const lastNumber = Number(
      lastTransaction.transactionNumber.split("-").pop()
    );

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${padNumber(nextNumber)}`;
}

module.exports = {
  generateReceiptNumber,
  generateVoucherNumber,
  generateLedgerNumber,
  generateExpenseNumber,
  generateAssetNumber,
  generateInventoryItemCode,
  generateStockTransactionNumber,
};