const DharamshalaDonation =
  require("../models/DharamshalaDonation");

const DharamshalaVoucher =
  require("../models/DharamshalaVoucher");

const DharamshalaLedger =
  require("../models/DharamshalaLedger");

const DharamshalaExpense = require("../models/DharamshalaExpense");

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

module.exports = {
  generateReceiptNumber,
  generateVoucherNumber,
  generateLedgerNumber,
  generateExpenseNumber
};