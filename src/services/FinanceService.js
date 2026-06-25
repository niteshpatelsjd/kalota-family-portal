const mongoose = require("mongoose");


const DharamshalaExpense =
  require("../models/DharamshalaExpense");

const DharamshalaExpenseItem =
  require("../models/DharamshalaExpenseItem");
const DharamshalaBankAccount =
  require("../models/DharamshalaBankAccount");

const DharamshalaVoucher =
  require("../models/DharamshalaVoucher");

const DharamshalaLedger =
  require("../models/DharamshalaLedger");

const DharamshalaDonation =
  require("../models/DharamshalaDonation");

  const Dharamshala = require("../models/Dharamshala");

const buildResponse =
  require("../utils/response");

const logger =
  require("../utils/logger");

const FinanceConstant =
  require("../constants/FinanceConstant");

  const DataConstant =
  require("../constants/DataConstant");


async function generateReceiptNumber() {
  const count = await DharamshalaDonation.countDocuments();

  return `DR-${new Date().getFullYear()}-${String(count + 1).padStart(
    5,
    "0"
  )}`;
}

async function generateLedgerNumber() {
  const count =
    await DharamshalaLedger.countDocuments();

  return `LED${String(
    count + 1
  ).padStart(6, "0")}`;
}

/* ─────────────────────────────────────
   ADD / UPDATE BANK ACCOUNT
───────────────────────────────────── */

exports.addBankAccount =
  async (data) => {
    try {
      const {
        id,
        dharamshalaId,
        accountName,
        bankName,
        branchName,
        accountNumber,
        ifscCode,
        accountType,
        openingBalance,
        currentBalance,
        balanceAsOn,
        isPrimary,
        accountHolderName,
        remarks,
        createdBy,
      } = data;

      logger.info(
        "addBankAccount service started"
      );

      if (!dharamshalaId) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Dharamshala is required",
          null
        );
      }

      if (!accountName?.trim()) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Account name is required",
          null
        );
      }

      if (!bankName?.trim()) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Bank name is required",
          null
        );
      }

      if (!accountNumber?.trim()) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Account number is required",
          null
        );
      }

      const existingAccount =
        await DharamshalaBankAccount.findOne({
          dharamshalaId,
          accountNumber: accountNumber.trim(),
          status: { $ne: 0 },
        });

      if (
        existingAccount &&
        (!id ||
          existingAccount._id.toString() !==
            id)
      ) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Bank account already exists",
          null
        );
      }

      if (isPrimary === true) {
        await DharamshalaBankAccount.updateMany(
          {
            dharamshalaId,
            isPrimary: true,
            ...(id
              ? {
                  _id: {
                    $ne: id,
                  },
                }
              : {}),
          },
          {
            $set: {
              isPrimary: false,
            },
          }
        );
      }

      const payload = {
        dharamshalaId,
        accountName:
          accountName.trim(),
        bankName:
          bankName.trim(),
        branchName:
          branchName || "",
        accountNumber:
          accountNumber.trim(),
        ifscCode:
          ifscCode || "",
        accountType:
          accountType || "TRUST",
        openingBalance:
          openingBalance || 0,
        currentBalance:
          currentBalance ||
          openingBalance ||
          0,
        balanceAsOn:
          balanceAsOn ||
          new Date(),
        isPrimary:
          isPrimary ?? true,
        accountHolderName:
          accountHolderName || "",
        remarks:
          remarks || "",
        createdBy,
      };

      let bankAccount;
      let message;

      if (
        !id ||
        id.trim() === ""
      ) {
        bankAccount =
          await DharamshalaBankAccount.create(
            payload
          );

        message =
          "Bank account created successfully";
      } else {
        bankAccount =
          await DharamshalaBankAccount.findByIdAndUpdate(
            id,
            payload,
            {
              new: true,
            }
          );

        if (!bankAccount) {
          return buildResponse(
            DataConstant.NOT_FOUND,
            "Bank account not found",
            null
          );
        }

        message =
          "Bank account updated successfully";
      }

      return buildResponse(
        DataConstant.OK,
        message,
        bankAccount
      );
    } catch (err) {
      logger.error(
        "addBankAccount service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getBankAccountById =
  async (id) => {
    try {
      logger.info(
        `getBankAccountById service ${id}`
      );

      if (!id) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          DataConstant.MESSAGES.INVALID_REQUEST,
          null
        );
      }

      const bankAccount =
        await DharamshalaBankAccount
          .findById(id);

      if (!bankAccount) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          FinanceConstant.MESSAGES.BANK_ACCOUNT_NOT_FOUND,
          null
        );
      }

      return buildResponse(
        DataConstant.SUCCESS.OK,
        DataConstant.MESSAGES.RECORD_FOUND,
        bankAccount
      );
    } catch (err) {
      logger.error(
        "getBankAccountById service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


  exports.getAllBankAccounts =
  async (data) => {
    try {
      const {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        status,
        isPrimary,
        searchText,
      } = data;

      const filter = {};

      if (dharamshalaId) {
        filter.dharamshalaId =
          dharamshalaId;
      }

      if (
        status !== undefined &&
        status !== null
      ) {
        filter.status = status;
      }

      if (
        isPrimary !== undefined &&
        isPrimary !== null
      ) {
        filter.isPrimary =
          isPrimary;
      }

      if (searchText) {
        filter.$or = [
          {
            accountName: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            bankName: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            accountNumber: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            accountHolderName: {
              $regex: searchText,
              $options: "i",
            },
          },
        ];
      }

      const totalRecords =
        await DharamshalaBankAccount.countDocuments(
          filter
        );

      const content =
        await DharamshalaBankAccount
          .find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(
            pageIndex * pageSize
          )
          .limit(pageSize);

      const totalPages =
        Math.ceil(
          totalRecords /
            pageSize
        );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        DataConstant.MESSAGES.RECORD_FOUND,
        {
          content,
          pageIndex,
          pageSize,
          totalRecords,
          totalPages,
          isLast:
            pageIndex >=
            totalPages - 1,
          hasNext:
            pageIndex <
            totalPages - 1,
          hasPrevious:
            pageIndex > 0,
        }
      );
    } catch (err) {
      logger.error(
        "getAllBankAccounts service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


  exports.blockUnblockBankAccount =
  async (
    id,
    status
  ) => {
    try {
      if (!id) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          DataConstant.MESSAGES.INVALID_REQUEST,
          null
        );
      }

      const bankAccount =
        await DharamshalaBankAccount.findById(
          id
        );

      if (!bankAccount) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          FinanceConstant.MESSAGES.BANK_ACCOUNT_NOT_FOUND,
          null
        );
      }

      bankAccount.status =
        status;

      await bankAccount.save();

      const message =
        status === 1
          ? FinanceConstant.MESSAGES.BANK_ACCOUNT_ACTIVE
          : FinanceConstant.MESSAGES.BANK_ACCOUNT_INACTIVE;

      return buildResponse(
        DataConstant.SUCCESS.OK,
        message,
        bankAccount
      );
    } catch (err) {
      logger.error(
        "blockUnblockBankAccount service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


exports.addVoucher =
  async (data) => {
    try {
      const {
        dharamshalaId,
        voucherType,
        category,
        purpose,
        requestedAmount,
        requestedBy,
        remarks,
      } = data;

      if (!dharamshalaId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala is required",
          null
        );
      }

      if (!voucherType) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Voucher type is required",
          null
        );
      }

      if (!category) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Category is required",
          null
        );
      }

      if (!purpose?.trim()) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Purpose is required",
          null
        );
      }

      if (
        !requestedAmount ||
        requestedAmount <= 0
      ) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Requested amount should be greater than zero",
          null
        );
      }

      if (!requestedBy) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Requested by is required",
          null
        );
      }

      const currentYear =
        new Date().getFullYear();

      const totalCount =
        await DharamshalaVoucher.countDocuments({
          dharamshalaId,
        });

      const voucherNumber =
        `VCH-${currentYear}-${String(
          totalCount + 1
        ).padStart(5, "0")}`;

      const voucher =
        await DharamshalaVoucher.create({
          dharamshalaId,
          voucherNumber,
          voucherType,
          category,
          purpose,
          requestedAmount,
          requestedBy,
          remarks: remarks || "",
          status: "PENDING",
        });

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Voucher created successfully",
        voucher
      );
    } catch (err) {
      logger.error(
        "addVoucher service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getVoucherById =
  async (id) => {
    try {
      if (!id) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          DataConstant.MESSAGES.INVALID_REQUEST,
          null
        );
      }

      const voucher =
        await DharamshalaVoucher
          .findById(id)
          .populate(
            "requestedBy",
            "firstName lastName"
          )
          .populate(
            "approvedBy",
            "firstName lastName"
          )
          .populate(
            "statusUpdatedBy",
            "firstName lastName"
          );

      if (!voucher) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          FinanceConstant.MESSAGES.VOUCHER_NOT_FOUND,
          null
        );
      }

      return buildResponse(
        DataConstant.SUCCESS.OK,
        DataConstant.MESSAGES.RECORD_FOUND,
        voucher
      );
    } catch (err) {
      logger.error(
        "getVoucherById service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getAllVouchers =
  async (data) => {
    try {
      const {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        voucherType,
        category,
        status,
        searchText,
        fromDate,
        toDate,
      } = data;

      const filter = {};

      if (dharamshalaId) {
        filter.dharamshalaId =
          dharamshalaId;
      }

      if (voucherType) {
        filter.voucherType =
          voucherType;
      }

      if (category) {
        filter.category =
          category;
      }

      if (status) {
        filter.status =
          status;
      }

      if (searchText) {
        filter.$or = [
          {
            voucherNumber: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            purpose: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            remarks: {
              $regex: searchText,
              $options: "i",
            },
          },
        ];
      }

      if (
        fromDate ||
        toDate
      ) {
        filter.voucherDate =
          {};

        if (fromDate) {
          filter.voucherDate.$gte =
            new Date(fromDate);
        }

        if (toDate) {
          filter.voucherDate.$lte =
            new Date(toDate);
        }
      }

      const totalRecords =
        await DharamshalaVoucher.countDocuments(
          filter
        );

      const content =
        await DharamshalaVoucher
          .find(filter)
          .populate(
            "requestedBy",
            "firstName lastName"
          )
          .populate(
            "approvedBy",
            "firstName lastName"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            pageIndex * pageSize
          )
          .limit(pageSize);

      const totalPages =
        Math.ceil(
          totalRecords /
            pageSize
        );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        DataConstant.MESSAGES.RECORD_FOUND,
        {
          content,
          pageIndex,
          pageSize,
          totalRecords,
          totalPages,
          isLast:
            pageIndex >=
            totalPages - 1,
          hasNext:
            pageIndex <
            totalPages - 1,
          hasPrevious:
            pageIndex > 0,
        }
      );
    } catch (err) {
      logger.error(
        "getAllVouchers service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


exports.updateVoucherStatus =
  async (data) => {
    try {
      const {
        voucherId,
        status,
        approvedAmount,
        statusReason,
        statusUpdatedBy,
      } = data;

      if (!voucherId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Voucher Id is required",
          null
        );
      }

      if (!status) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Status is required",
          null
        );
      }

      const allowedStatuses = [
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          FinanceConstant.MESSAGES.INVALID_VOUCHER_STATUS,
          null
        );
      }

      const voucher =
        await DharamshalaVoucher.findById(
          voucherId
        );

      if (!voucher) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          FinanceConstant.MESSAGES.VOUCHER_NOT_FOUND,
          null
        );
      }

      if (
        [
          "REJECTED",
          "CANCELLED",
        ].includes(
          voucher.status
        )
      ) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          FinanceConstant.MESSAGES.VOUCHER_ALREADY_PROCESSED,
          null
        );
      }

      if (
        voucher.status ===
        "APPROVED"
      ) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Voucher already approved",
          null
        );
      }

      voucher.status =
        status;

      voucher.statusReason =
        statusReason || "";

      voucher.statusUpdatedBy =
        statusUpdatedBy ||
        null;

      voucher.statusUpdatedAt =
        new Date();

      if (
        status ===
        "APPROVED"
      ) {
        voucher.approvedAmount =
          approvedAmount ||
          voucher.requestedAmount;

        voucher.approvedBy =
          statusUpdatedBy;

        voucher.approvedAt =
          new Date();
      }

      await voucher.save();

      let message =
        DataConstant.MESSAGES.UPDATE;

      if (
        status ===
        "APPROVED"
      ) {
        message =
          FinanceConstant.MESSAGES.VOUCHER_APPROVED;
      }

      if (
        status ===
        "REJECTED"
      ) {
        message =
          FinanceConstant.MESSAGES.VOUCHER_REJECTED;
      }

      if (
        status ===
        "CANCELLED"
      ) {
        message =
          FinanceConstant.MESSAGES.VOUCHER_CANCELLED;
      }

      return buildResponse(
        DataConstant.SUCCESS.OK,
        message,
        voucher
      );
    } catch (err) {
      logger.error(
        "updateVoucherStatus service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


exports.createLedgerEntry =
  async (data) => {
    try {
      const {
        dharamshalaId,
        bankAccountId,
        voucherId,
        transactionType,
        category,
        amount,
        transactionDate,
        description,
        committeeMemberId,
        referenceNumber,
        createdBy,
      } = data;

      /* ─────────────────────────────────────
         VALIDATIONS
      ───────────────────────────────────── */

      if (!dharamshalaId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala is required",
          null
        );
      }

      if (!bankAccountId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Bank account is required",
          null
        );
      }

      if (!voucherId) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Voucher is required",
          null
        );
      }

      if (!transactionType) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Transaction type is required",
          null
        );
      }

      if (!category) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Category is required",
          null
        );
      }

      if (!amount || amount <= 0) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Amount should be greater than zero",
          null
        );
      }

      /* ─────────────────────────────────────
         FETCH BANK ACCOUNT
      ───────────────────────────────────── */

      const bankAccount =
        await DharamshalaBankAccount.findById(
          bankAccountId
        );

      if (!bankAccount) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Bank account not found",
          null
        );
      }

      /* ─────────────────────────────────────
         FETCH VOUCHER
      ───────────────────────────────────── */

      const voucher =
        await DharamshalaVoucher.findById(
          voucherId
        );

      if (!voucher) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Voucher not found",
          null
        );
      }

      if (voucher.status !== "APPROVED") {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Only approved vouchers can create ledger entries",
          null
        );
      }

      /* ─────────────────────────────────────
         ADVANCE RULE
      ───────────────────────────────────── */

      if (
        voucher.category === "ADVANCE" &&
        transactionType !== "DEBIT"
      ) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Advance voucher must create a DEBIT entry",
          null
        );
      }

      /* ─────────────────────────────────────
         GENERATE NUMBERS
      ───────────────────────────────────── */

      const currentYear =
        new Date().getFullYear();

      const totalLedgerCount =
        await DharamshalaLedger.countDocuments({
          dharamshalaId,
        });

      const transactionNumber =
        `TXN-${currentYear}-${String(
          totalLedgerCount + 1
        ).padStart(5, "0")}`;

      const ledgerNumber =
        await generateLedgerNumber();

      /* ─────────────────────────────────────
         CALCULATE BANK BALANCE
      ───────────────────────────────────── */

      const currentBalance =
        bankAccount.currentBalance || 0;

      let updatedBalance =
        currentBalance;

      if (
        transactionType === "CREDIT"
      ) {
        updatedBalance =
          currentBalance + amount;
      }

      if (
        transactionType === "DEBIT"
      ) {
        if (
          currentBalance < amount
        ) {
          return buildResponse(
            DataConstant.CLIENT_ERROR.BAD_REQUEST,
            "Insufficient bank balance",
            null
          );
        }

        updatedBalance =
          currentBalance - amount;
      }

      /* ─────────────────────────────────────
         CREATE LEDGER ENTRY
      ───────────────────────────────────── */

      const ledger =
        await DharamshalaLedger.create({
          dharamshalaId,

          bankAccountId,

          voucherId,

          ledgerNumber,

          voucherNumber:
            voucher.voucherNumber,

          transactionNumber,

          transactionDate:
            transactionDate ||
            new Date(),

          transactionType,

          category,

          amount,

          creditAmount:
            transactionType === "CREDIT"
              ? amount
              : 0,

          debitAmount:
            transactionType === "DEBIT"
              ? amount
              : 0,

          runningBalance:
            updatedBalance,

          description:
            description || "",

          createdBy,

          committeeMemberId:
            committeeMemberId || null,

          referenceNumber:
            referenceNumber || "",

          status: "SUCCESS",
        });

      /* ─────────────────────────────────────
         UPDATE BANK ACCOUNT
      ───────────────────────────────────── */

      await DharamshalaBankAccount.findByIdAndUpdate(
        bankAccountId,
        {
          currentBalance:
            updatedBalance,

          balanceAsOn:
            new Date(),
        }
      );

      /* ─────────────────────────────────────
         AUTO COMPLETE NON-ADVANCE VOUCHERS
      ───────────────────────────────────── */

      if (
        voucher.category !== "ADVANCE"
      ) {
        await DharamshalaVoucher.findByIdAndUpdate(
          voucherId,
          {
            settledAmount: amount,
            status: "SETTLED",
            lastSettlementDate:
              new Date(),
          }
        );
      }

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Ledger entry created successfully",
        ledger
      );
    } catch (err) {
      logger.error(
        "createLedgerEntry service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getLedgerById =
  async (id) => {
    try {

      const ledger =
        await DharamshalaLedger
          .findById(id)

          .populate(
            "voucherId",
            "voucherNumber voucherType category purpose status"
          )

          .populate(
            "bankAccountId",
            "accountName bankName accountNumber currentBalance"
          )

          .populate(
            "createdBy",
            "firstName lastName"
          );

      if (!ledger) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          FinanceConstant.MESSAGES.LEDGER_NOT_FOUND,
          null
        );
      }

      return buildResponse(
        DataConstant.SUCCESS.OK,
        DataConstant.MESSAGES.RECORD_FOUND,
        ledger
      );

    } catch (err) {

      logger.error(
        "getLedgerById service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getAllLedgerEntries =
  async (filters) => {
    try {

      const {
        pageIndex,
        pageSize,
        dharamshalaId,
        voucherId,
        bankAccountId,
        category,
        transactionType,
        fromDate,
        toDate,
        searchText,
      } = filters;

      const query = {
        statusFlag: 1,
      };

      if (dharamshalaId) {
        query.dharamshalaId =
          dharamshalaId;
      }

      if (voucherId) {
        query.voucherId =
          voucherId;
      }

      if (bankAccountId) {
        query.bankAccountId =
          bankAccountId;
      }

      if (category) {
        query.category =
          category;
      }

      if (transactionType) {
        query.transactionType =
          transactionType;
      }

      if (
        fromDate ||
        toDate
      ) {

        query.transactionDate =
          {};

        if (fromDate) {
          query.transactionDate.$gte =
            new Date(fromDate);
        }

        if (toDate) {

          const endDate =
            new Date(toDate);

          endDate.setHours(
            23,
            59,
            59,
            999
          );

          query.transactionDate.$lte =
            endDate;
        }
      }

      if (searchText) {

        query.$or = [
          {
            ledgerNumber: {
              $regex:
                searchText,
              $options: "i",
            },
          },
          {
            voucherNumber: {
              $regex:
                searchText,
              $options: "i",
            },
          },
          {
            description: {
              $regex:
                searchText,
              $options: "i",
            },
          },
          {
            referenceNumber: {
              $regex:
                searchText,
              $options: "i",
            },
          },
        ];
      }

      const totalCount =
        await DharamshalaLedger.countDocuments(
          query
        );

      const records =
        await DharamshalaLedger
          .find(query)

          .populate(
            "voucherId",
            "voucherNumber category"
          )

          .populate(
            "bankAccountId",
            "accountName bankName"
          )

          .sort({
            transactionDate: -1,
          })

          .skip(
            pageIndex *
              pageSize
          )

          .limit(pageSize);

      return buildResponse(
        DataConstant.SUCCESS.OK,
        DataConstant.MESSAGES.RECORD_FOUND,
        {
          totalCount,
          records,
        }
      );

    } catch (err) {

      logger.error(
        "getAllLedgerEntries service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


exports.getAdvanceOutstanding =
  async (filters) => {

    try {

      const {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        committeeMemberId,
      } = filters;

      const query = {
        category: "ADVANCE",
        status: {
          $in: [
            "APPROVED",
            "PARTIALLY_SETTLED",
          ],
        },
      };

      if (dharamshalaId) {
        query.dharamshalaId =
          dharamshalaId;
      }

      if (committeeMemberId) {
        query.requestedBy =
          committeeMemberId;
      }

      query.$expr = {
        $gt: [
          "$approvedAmount",
          "$settledAmount",
        ],
      };

      const totalCount =
        await DharamshalaVoucher.countDocuments(
          query
        );

      const vouchers =
        await DharamshalaVoucher
          .find(query)
          .populate(
            "requestedBy",
            "firstName lastName"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            pageIndex * pageSize
          )
          .limit(pageSize);

      const records =
        vouchers.map(
          (voucher) => ({
            id: voucher._id,

            voucherNumber:
              voucher.voucherNumber,

            purpose:
              voucher.purpose,

            requestedById:
              voucher.requestedBy?._id,

            requestedBy:
              voucher.requestedBy
                ? `${voucher.requestedBy.firstName || ""} ${voucher.requestedBy.lastName || ""}`.trim()
                : "",

            approvedAmount:
              voucher.approvedAmount,

            settledAmount:
              voucher.settledAmount,

            pendingAmount:
              voucher.approvedAmount -
              voucher.settledAmount,

            approvedAt:
              voucher.approvedAt,

            status:
              voucher.status,
          })
        );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Outstanding advances fetched successfully",
        {
          totalCount,
          pageIndex,
          pageSize,
          records,
        }
      );

    } catch (err) {

      logger.error(
        "getAdvanceOutstanding service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getBankBalance =
  async (bankAccountId) => {
    try {

      const account =
        await DharamshalaBankAccount.findById(
          bankAccountId
        );

      if (!account) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          FinanceConstant.MESSAGES.BANK_ACCOUNT_NOT_FOUND,
          null
        );
      }

      const response = {
        id: account._id,

        accountName:
          account.accountName,

        bankName:
          account.bankName,

        accountNumber:
          account.accountNumber,

        currentBalance:
          account.currentBalance,

        openingBalance:
          account.openingBalance,

        balanceAsOn:
          account.balanceAsOn,

        accountType:
          account.accountType,

        isPrimary:
          account.isPrimary,
      };

      return buildResponse(
        DataConstant.SUCCESS.OK,
        DataConstant.MESSAGES.RECORD_FOUND,
        response
      );

    } catch (err) {

      logger.error(
        "getBankBalance service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


exports.getFinanceDashboard =
  async (dharamshalaId) => {

    try {

      logger.info(
        "getFinanceDashboard service started",
        { dharamshalaId }
      );

      if (!dharamshalaId) {

        logger.warn(
          "getFinanceDashboard validation failed : dharamshalaId missing"
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala Id is required",
          null
        );
      }

      const objectId =
        new mongoose.Types.ObjectId(
          dharamshalaId
        );

      /* -----------------------------
         TOTAL BANK BALANCE
      ----------------------------- */

      const bankBalanceResult =
        await DharamshalaBankAccount.aggregate([
          {
            $match: {
              dharamshalaId:
                objectId,
              status: 1,
            },
          },
          {
            $group: {
              _id: null,
              totalBalance: {
                $sum:
                  "$currentBalance",
              },
            },
          },
        ]);

      const bankBalance =
        bankBalanceResult?.[0]
          ?.totalBalance || 0;

      /* -----------------------------
         TOTAL DONATIONS
      ----------------------------- */

      const donationResult =
        await DharamshalaLedger.aggregate([
          {
            $match: {
              dharamshalaId:
                objectId,

              category:
                "DONATION",

              transactionType:
                "CREDIT",

              status:
                "SUCCESS",
            },
          },
          {
            $group: {
              _id: null,
              totalDonation: {
                $sum:
                  "$amount",
              },
            },
          },
        ]);

      const totalDonations =
        donationResult?.[0]
          ?.totalDonation || 0;
/* -----------------------------
   TOTAL EXPENSES
----------------------------- */

const expenseResult =
  await DharamshalaExpense.aggregate([
    {
      $match: {
        dharamshalaId:
          objectId,
      },
    },
    {
      $group: {
        _id: null,
        totalExpense: {
          $sum: "$amount",
        },
      },
    },
  ]);

const totalExpenses =
  expenseResult?.[0]
    ?.totalExpense || 0;

      /* -----------------------------
         TOTAL ADVANCE ISSUED
      ----------------------------- */

      const advanceResult =
        await DharamshalaVoucher.aggregate([
          {
            $match: {
              dharamshalaId:
                objectId,

              category:
                "ADVANCE",
            },
          },
          {
            $group: {
              _id: null,
              totalAdvance: {
                $sum:
                  "$approvedAmount",
              },
            },
          },
        ]);

      const totalAdvanceIssued =
        advanceResult?.[0]
          ?.totalAdvance || 0;

      /* -----------------------------
         OUTSTANDING ADVANCES
      ----------------------------- */

      const outstandingResult =
        await DharamshalaVoucher.aggregate([
          {
            $match: {
              dharamshalaId:
                objectId,

              category:
                "ADVANCE",

              status: {
                $in: [
                  "APPROVED",
                  "PARTIALLY_SETTLED",
                ],
              },
            },
          },
          {
            $project: {
              pendingAmount: {
                $subtract: [
                  "$approvedAmount",
                  "$settledAmount",
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPending: {
                $sum:
                  "$pendingAmount",
              },
            },
          },
        ]);

      const outstandingAdvances =
        outstandingResult?.[0]
          ?.totalPending || 0;

      /* -----------------------------
         VOUCHER COUNTS
      ----------------------------- */

      const pendingVoucherCount =
        await DharamshalaVoucher.countDocuments(
          {
            dharamshalaId,
            status:
              "PENDING",
          }
        );

      const approvedVoucherCount =
        await DharamshalaVoucher.countDocuments(
          {
            dharamshalaId,
            status:
              "APPROVED",
          }
        );

      const settledVoucherCount =
        await DharamshalaVoucher.countDocuments(
          {
            dharamshalaId,
            status:
              "SETTLED",
          }
        );

      /* -----------------------------
         TOTAL TRANSACTIONS
      ----------------------------- */

      const totalTransactions =
        await DharamshalaLedger.countDocuments(
          {
            dharamshalaId,
            status:
              "SUCCESS",
          }
        );

      /* -----------------------------
         TOTAL EXPENSE RECORDS
      ----------------------------- */

      const totalExpenseRecords =
        await DharamshalaExpense.countDocuments(
          {
            dharamshalaId,
          }
        );

      const response = {
        bankBalance,

        totalDonations,

        totalExpenses,

        totalAdvanceIssued,

        outstandingAdvances,

        pendingVoucherCount,

        approvedVoucherCount,

        settledVoucherCount,

        totalTransactions,

        totalExpenseRecords,
      };

      logger.info(
        "getFinanceDashboard success",
        response
      );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Finance dashboard fetched successfully",
        response
      );

    } catch (err) {

      logger.error(
        "getFinanceDashboard service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };



 exports.getBankStatement = async (data) => {
  try {
    const {
      dharamshalaId,
      bankAccountId,
      fromDate,
      toDate,
      pageIndex = 0,
      pageSize = 10,
    } = data;

    if (!dharamshalaId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Dharamshala is required",
        null
      );
    }

    const dharamshala =
      await Dharamshala.findById(dharamshalaId)
        .select(
          "name address mobileNumber alternateMobileNumber email website establishedYear profileImage bannerImage"
        )
        .lean();

    if (!dharamshala) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Dharamshala not found",
        null
      );
    }

    let bankAccount = null;

    if (bankAccountId) {
      bankAccount =
        await DharamshalaBankAccount.findById(bankAccountId)
          .select(
            "accountName bankName branchName accountNumber ifscCode accountType openingBalance currentBalance balanceAsOn isPrimary accountHolderName remarks"
          )
          .lean();

      if (!bankAccount) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Bank account not found",
          null
        );
      }
    }

    const filter = {
      dharamshalaId,
      statusFlag: 1,
      status: "SUCCESS",
    };

    if (bankAccountId) {
      filter.bankAccountId = bankAccountId;
    }

    if (fromDate || toDate) {
      filter.transactionDate = {};

      if (fromDate) {
        filter.transactionDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = endDate;
      }
    }

    const skip = Number(pageIndex) * Number(pageSize);
    const limit = Number(pageSize);

    const totalCount = await DharamshalaLedger.countDocuments(filter);

    const ledgerEntries = await DharamshalaLedger.find(filter)
      //.populate("bankAccountId", "accountName bankName accountNumber")
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const summaryEntries = await DharamshalaLedger.find(filter)
      .select("creditAmount debitAmount")
      .lean();

    let totalCredit = 0;
    let totalDebit = 0;

    summaryEntries.forEach((entry) => {
      totalCredit += entry.creditAmount || 0;
      totalDebit += entry.debitAmount || 0;
    });

    let openingBalance = 0;
    let closingBalance = 0;

    if (bankAccount) {
      closingBalance = bankAccount.currentBalance || 0;
      openingBalance = closingBalance + totalDebit - totalCredit;
    }

    const statement = ledgerEntries.map((entry) => ({
      transactionDate: entry.transactionDate,
      voucherNumber: entry.voucherNumber,
      ledgerNumber: entry.ledgerNumber,
      transactionNumber: entry.transactionNumber,
      category: entry.category,
      description: entry.description,
      credit: entry.creditAmount,
      debit: entry.debitAmount,
      runningBalance: entry.runningBalance,
      
    }));

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Bank statement fetched successfully",
      {
        dharamshala,
        bankAccount,
        openingBalance,
        closingBalance,
        totalCredit,
        totalDebit,
        totalCount,
        pageIndex: Number(pageIndex),
        pageSize: Number(pageSize),
        data: statement,
      }
    );
  } catch (err) {
    logger.error("getBankStatement service error", {
      error: err.message,
      stack: err.stack,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      err.message,
      null
    );
  }
};


/* ─────────────────────────────────────
   GENERATE EXPENSE NUMBER
───────────────────────────────────── */

async function generateExpenseNumber() {

  const count =
    await DharamshalaExpense.countDocuments();

  return `EXP-${String(
    count + 1
  ).padStart(6, "0")}`;
}

/* ─────────────────────────────────────
   ADD EXPENSE
───────────────────────────────────── */

exports.addExpense =
  async (data) => {

    try {

      logger.info(
        "addExpense service started",
        {
          request: data,
        }
      );

      const {
        dharamshalaId,
        voucherId,
        ledgerId,
        expenseType,
        title,
        vendorName,
        vendorMobile,
        billNumber,
        billDate,
        amount,
        paymentMode,
        description,
        attachmentUrls,
        items,
        createdBy,
      } = data;

      /* -----------------------------
         VALIDATIONS
      ----------------------------- */

      if (!dharamshalaId) {

        logger.warn(
          "addExpense validation failed : dharamshalaId missing"
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala is required",
          null
        );
      }

      if (!voucherId) {

        logger.warn(
          "addExpense validation failed : voucherId missing"
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Voucher is required",
          null
        );
      }

      if (!expenseType) {

        logger.warn(
          "addExpense validation failed : expenseType missing"
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Expense type is required",
          null
        );
      }

      if (!title?.trim()) {

        logger.warn(
          "addExpense validation failed : title missing"
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Title is required",
          null
        );
      }

      if (!amount || amount <= 0) {

        logger.warn(
          "addExpense validation failed : invalid amount",
          {
            amount,
          }
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Amount should be greater than zero",
          null
        );
      }

      logger.info(
        "addExpense validation completed successfully"
      );

      /* -----------------------------
         FETCH VOUCHER
      ----------------------------- */

      logger.info(
        "Fetching voucher",
        {
          voucherId,
        }
      );

      const voucher =
        await DharamshalaVoucher.findById(
          voucherId
        );

      if (!voucher) {

        logger.warn(
          "Voucher not found",
          {
            voucherId,
          }
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Voucher not found",
          null
        );
      }

      logger.info(
        "Voucher fetched successfully",
        {
          voucherId,
          voucherNumber:
            voucher.voucherNumber,
          category:
            voucher.category,
          approvedAmount:
            voucher.approvedAmount,
          settledAmount:
            voucher.settledAmount,
        }
      );

      /* -----------------------------
         GENERATE EXPENSE NUMBER
      ----------------------------- */

      const expenseNumber =
        await generateExpenseNumber();

      logger.info(
        "Expense number generated",
        {
          expenseNumber,
        }
      );

      /* -----------------------------
         CREATE EXPENSE
      ----------------------------- */

      logger.info(
        "Creating expense entry"
      );

      const expense =
        await DharamshalaExpense.create({
          dharamshalaId,
          voucherId,
          ledgerId,
          expenseNumber,
          expenseType,
          title,
          vendorName:
            vendorName || "",
          vendorMobile:
            vendorMobile || "",
          billNumber:
            billNumber || "",
          billDate,
          amount,
          paymentMode:
            paymentMode || "BANK",
          description:
            description || "",
          attachmentUrls:
            attachmentUrls || [],
          createdBy,
        });

      logger.info(
        "Expense created successfully",
        {
          expenseId:
            expense._id,
          expenseNumber:
            expense.expenseNumber,
          amount:
            expense.amount,
        }
      );

      /* -----------------------------
         CREATE ITEMS
      ----------------------------- */

      if (
        Array.isArray(items) &&
        items.length > 0
      ) {

        logger.info(
          "Creating expense items",
          {
            itemCount:
              items.length,
          }
        );

        const expenseItems =
          items.map((item) => ({
            expenseId:
              expense._id,

            itemType:
              item.itemType ||
              "MATERIAL",

            itemName:
              item.itemName,

            quantity:
              item.quantity || 1,

            unit:
              item.unit || "",

            rate:
              item.rate || 0,

            amount:
              item.amount || 0,

            remarks:
              item.remarks || "",
          }));

        await DharamshalaExpenseItem.insertMany(
          expenseItems
        );

        logger.info(
          "Expense items created successfully",
          {
            expenseId:
              expense._id,
            itemCount:
              expenseItems.length,
          }
        );
      } else {

        logger.info(
          "No expense items received"
        );
      }

      /* -----------------------------
         ADVANCE SETTLEMENT
      ----------------------------- */

      if (
        voucher.category ===
        "ADVANCE"
      ) {

        logger.info(
          "Processing advance settlement",
          {
            voucherId,
            approvedAmount:
              voucher.approvedAmount,
            previousSettledAmount:
              voucher.settledAmount,
            expenseAmount:
              amount,
          }
        );

        const settledAmount =
          voucher.settledAmount +
          amount;

        const pendingAmount =
          voucher.approvedAmount -
          settledAmount;

        let voucherStatus =
          "PARTIALLY_SETTLED";

        if (
          pendingAmount <= 0
        ) {
          voucherStatus =
            "SETTLED";
        }

        await DharamshalaVoucher.findByIdAndUpdate(
          voucherId,
          {
            settledAmount,

            lastSettlementDate:
              new Date(),

            status:
              voucherStatus,
          }
        );

        logger.info(
          "Advance settlement completed",
          {
            voucherId,
            settledAmount,
            pendingAmount,
            voucherStatus,
          }
        );
      }

      const response =
        buildResponse(
          DataConstant.SUCCESS.OK,
          "Expense created successfully",
          expense
        );

      logger.info(
        "addExpense service completed successfully",
        {
          expenseId:
            expense._id,
          responseCode:
            response.responseCode,
        }
      );

      return response;

    } catch (err) {

      logger.error(
        "addExpense service error",
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


exports.getExpenseById =
  async (expenseId) => {

    try {

      logger.info(
        "getExpenseById service started",
        { expenseId }
      );

      if (!expenseId) {

        logger.warn(
          "Expense Id missing"
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Expense Id is required",
          null
        );
      }

      const expense =
        await DharamshalaExpense.findById(
          expenseId
        )
          .populate(
            "voucherId",
            "voucherNumber category purpose approvedAmount settledAmount status"
          )
          .populate(
            "ledgerId",
            "ledgerNumber transactionNumber amount transactionDate"
          )
          .populate(
            "createdBy",
            "fullName mobileNumber"
          );

      if (!expense) {

        logger.warn(
          "Expense not found",
          { expenseId }
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Expense not found",
          null
        );
      }

      const items =
        await DharamshalaExpenseItem.find(
          {
            expenseId:
              expense._id,
          }
        );

      logger.info(
        "Expense fetched successfully",
        {
          expenseId,
          itemCount:
            items.length,
        }
      );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Expense fetched successfully",
        {
          ...expense.toObject(),
          items,
        }
      );

    } catch (err) {

      logger.error(
        "getExpenseById service error",
        {
          error: err.message,
          stack: err.stack,
          expenseId,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getAllExpenses =
  async (data) => {

    try {

      logger.info(
        "getAllExpenses service started",
        { request: data }
      );

      const {
        pageIndex,
        pageSize,
        dharamshalaId,
        expenseType,
        voucherId,
        searchText,
        fromDate,
        toDate,
      } = data;

      const filter = {};

      if (dharamshalaId) {
        filter.dharamshalaId =
          dharamshalaId;
      }

      if (expenseType) {
        filter.expenseType =
          expenseType;
      }

      if (voucherId) {
        filter.voucherId =
          voucherId;
      }

      if (
        searchText &&
        searchText.trim()
      ) {
        filter.$or = [
          {
            expenseNumber: {
              $regex:
                searchText,
              $options: "i",
            },
          },
          {
            title: {
              $regex:
                searchText,
              $options: "i",
            },
          },
          {
            vendorName: {
              $regex:
                searchText,
              $options: "i",
            },
          },
          {
            billNumber: {
              $regex:
                searchText,
              $options: "i",
            },
          },
        ];
      }

      if (
        fromDate ||
        toDate
      ) {

        filter.billDate = {};

        if (fromDate) {
          filter.billDate.$gte =
            new Date(fromDate);
        }

        if (toDate) {

          const endDate =
            new Date(toDate);

          endDate.setHours(
            23,
            59,
            59,
            999
          );

          filter.billDate.$lte =
            endDate;
        }
      }

      logger.info(
        "Expense filter prepared",
        filter
      );

      const totalCount =
        await DharamshalaExpense.countDocuments(
          filter
        );

      const expenses =
        await DharamshalaExpense.find(
          filter
        )
          .populate(
            "voucherId",
            "voucherNumber category status"
          )
          .populate(
            "ledgerId",
            "ledgerNumber"
          )
          .populate(
            "createdBy",
            "fullName mobileNumber"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            pageIndex *
              pageSize
          )
          .limit(pageSize);

      logger.info(
        "Expenses fetched successfully",
        {
          totalCount,
          returned:
            expenses.length,
        }
      );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Expenses fetched successfully",
        {
          totalCount,
          pageIndex,
          pageSize,
          data: expenses,
        }
      );

    } catch (err) {

      logger.error(
        "getAllExpenses service error",
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


exports.getCommitteeMemberAdvanceSummary =
  async (filters) => {

    try {

      const {
        dharamshalaId,
      } = filters;

      logger.info(
        "getCommitteeMemberAdvanceSummary started",
        { dharamshalaId }
      );

      if (!dharamshalaId) {

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala Id is required",
          null
        );
      }

      const result =
        await DharamshalaVoucher.aggregate([
          {
            $match: {
              dharamshalaId:
                new mongoose.Types.ObjectId(
                  dharamshalaId
                ),

              category:
                "ADVANCE",
            },
          },

          {
            $group: {
              _id:
                "$requestedBy",

              totalAdvanceTaken:
                {
                  $sum:
                    "$approvedAmount",
                },

              totalSettled:
                {
                  $sum:
                    "$settledAmount",
                },

              voucherCount:
                {
                  $sum: 1,
                },
            },
          },

          {
            $lookup: {
              from:
                "admin_users",

              localField:
                "_id",

              foreignField:
                "_id",

              as:
                "member",
            },
          },

          {
            $unwind: {
              path:
                "$member",

              preserveNullAndEmptyArrays:
                true,
            },
          },

          {
            $project: {
              _id: 0,

              committeeMemberId:
                "$_id",

              memberName: {
                $trim: {
                  input: {
                    $concat: [
                      {
                        $ifNull: [
                          "$member.firstName",
                          "",
                        ],
                      },
                      " ",
                      {
                        $ifNull: [
                          "$member.lastName",
                          "",
                        ],
                      },
                    ],
                  },
                },
              },

              voucherCount: 1,

              totalAdvanceTaken: 1,

              totalSettled: 1,

              totalOutstanding:
                {
                  $subtract: [
                    "$totalAdvanceTaken",
                    "$totalSettled",
                  ],
                },
            },
          },

          {
            $sort: {
              totalOutstanding:
                -1,
            },
          },
        ]);

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Committee member advance summary fetched successfully",
        result
      );

    } catch (err) {

      logger.error(
        "getCommitteeMemberAdvanceSummary service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


exports.getCommitteeMemberAdvanceDetails =
  async (filters) => {

    try {

      const {
        dharamshalaId,
        committeeMemberId,
        pageIndex = 0,
        pageSize = 10,
      } = filters;

      logger.info(
        "getCommitteeMemberAdvanceDetails started",
        {
          dharamshalaId,
          committeeMemberId,
        }
      );

      if (!dharamshalaId) {

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala Id is required",
          null
        );
      }

      if (!committeeMemberId) {

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Committee Member Id is required",
          null
        );
      }

      const query = {
        dharamshalaId,

        requestedBy:
          committeeMemberId,

        category:
          "ADVANCE",
      };

      const totalCount =
        await DharamshalaVoucher.countDocuments(
          query
        );

      const vouchers =
        await DharamshalaVoucher
          .find(query)
          .populate(
            "requestedBy",
            "firstName lastName"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            pageIndex * pageSize
          )
          .limit(pageSize);

      const records =
        vouchers.map(
          (voucher) => ({

            id:
              voucher._id,

            voucherNumber:
              voucher.voucherNumber,

            purpose:
              voucher.purpose,

            approvedAmount:
              voucher.approvedAmount,

            settledAmount:
              voucher.settledAmount,

            pendingAmount:
              voucher.approvedAmount -
              voucher.settledAmount,

            approvedAt:
              voucher.approvedAt,

            status:
              voucher.status,

            requestedBy:
              voucher.requestedBy
                ? `${voucher.requestedBy.firstName || ""} ${voucher.requestedBy.lastName || ""}`.trim()
                : "",
          })
        );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Committee member advance details fetched successfully",
        {
          totalCount,
          pageIndex:
            Number(pageIndex),
          pageSize:
            Number(pageSize),
          records,
        }
      );

    } catch (err) {

      logger.error(
        "getCommitteeMemberAdvanceDetails service error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };


  exports.getExpenseReport =
  async (filters) => {

    try {

      const {
        dharamshalaId,
        expenseType,
        vendorName,
        fromDate,
        toDate,
        pageIndex = 0,
        pageSize = 10,
      } = filters;

      logger.info(
        "getExpenseReport started",
        { filters }
      );

      if (!dharamshalaId) {

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala Id is required",
          null
        );
      }

      const query = {
        dharamshalaId,
      };

      if (expenseType) {
        query.expenseType =
          expenseType;
      }

      if (vendorName) {
        query.vendorName = {
          $regex: vendorName,
          $options: "i",
        };
      }

      if (
        fromDate ||
        toDate
      ) {

        query.billDate = {};

        if (fromDate) {
          query.billDate.$gte =
            new Date(fromDate);
        }

        if (toDate) {
          query.billDate.$lte =
            new Date(toDate);
        }
      }

      const totalCount =
        await DharamshalaExpense.countDocuments(
          query
        );

      const expenses =
        await DharamshalaExpense
          .find(query)
          .populate(
            "voucherId",
            "voucherNumber"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            Number(pageIndex) *
            Number(pageSize)
          )
          .limit(
            Number(pageSize)
          );

      const totalExpenseResult =
        await DharamshalaExpense.aggregate([
          {
            $match: {
              dharamshalaId:
                new mongoose.Types.ObjectId(
                  dharamshalaId
                ),
            },
          },
          {
            $group: {
              _id: null,
              totalExpense: {
                $sum: "$amount",
              },
            },
          },
        ]);

      const totalExpense =
        totalExpenseResult?.[0]
          ?.totalExpense || 0;

      const records =
        expenses.map(
          (expense) => ({
            id:
              expense._id,

            expenseNumber:
              expense.expenseNumber,

            voucherNumber:
              expense
                ?.voucherId
                ?.voucherNumber || "",

            expenseType:
              expense.expenseType,

            title:
              expense.title,

            vendorName:
              expense.vendorName,

            billNumber:
              expense.billNumber,

            billDate:
              expense.billDate,

            amount:
              expense.amount,

            paymentMode:
              expense.paymentMode,

            createdAt:
              expense.createdAt,
          })
        );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Expense report fetched successfully",
        {
          totalExpense,
          totalCount,
          pageIndex:
            Number(pageIndex),
          pageSize:
            Number(pageSize),
          records,
        }
      );

    } catch (err) {

      logger.error(
        "getExpenseReport service error",
        {
          error:
            err.message,
          stack:
            err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getCashBookReport =
  async (filters) => {

    try {

      const {
        dharamshalaId,
        bankAccountId,
        fromDate,
        toDate,
        pageIndex = 0,
        pageSize = 10,
      } = filters;

      logger.info(
        "getCashBookReport started",
        { filters }
      );

      if (!dharamshalaId) {

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala Id is required",
          null
        );
      }

      const query = {
        dharamshalaId,
        status: "SUCCESS",
      };

      if (bankAccountId) {
        query.bankAccountId =
          bankAccountId;
      }

      if (
        fromDate ||
        toDate
      ) {

        query.transactionDate =
          {};

        if (fromDate) {
          query.transactionDate.$gte =
            new Date(fromDate);
        }

        if (toDate) {
          query.transactionDate.$lte =
            new Date(toDate);
        }
      }

      const totalCount =
        await DharamshalaLedger.countDocuments(
          query
        );

      const records =
        await DharamshalaLedger
          .find(query)
          .populate(
            "bankAccountId",
            "accountName bankName accountNumber"
          )
          .sort({
            transactionDate: 1,
          })
          .skip(
            Number(pageIndex) *
            Number(pageSize)
          )
          .limit(
            Number(pageSize)
          );

      /* -----------------------------
         TOTAL CREDIT
      ----------------------------- */

      const creditResult =
        await DharamshalaLedger.aggregate([
          {
            $match: {
              ...query,
              transactionType:
                "CREDIT",
            },
          },
          {
            $group: {
              _id: null,
              totalCredit: {
                $sum:
                  "$amount",
              },
            },
          },
        ]);

      const totalCredit =
        creditResult?.[0]
          ?.totalCredit || 0;

      /* -----------------------------
         TOTAL DEBIT
      ----------------------------- */

      const debitResult =
        await DharamshalaLedger.aggregate([
          {
            $match: {
              ...query,
              transactionType:
                "DEBIT",
            },
          },
          {
            $group: {
              _id: null,
              totalDebit: {
                $sum:
                  "$amount",
              },
            },
          },
        ]);

      const totalDebit =
        debitResult?.[0]
          ?.totalDebit || 0;

      /* -----------------------------
         OPENING BALANCE
      ----------------------------- */

      let openingBalance = 0;

      if (records.length > 0) {

        const firstRecord =
          records[0];

        openingBalance =
          firstRecord.runningBalance -
          firstRecord.creditAmount +
          firstRecord.debitAmount;
      }

      /* -----------------------------
         CLOSING BALANCE
      ----------------------------- */

      const closingBalance =
        records.length > 0
          ? records[
              records.length - 1
            ].runningBalance
          : openingBalance;

      const data =
        records.map(
          (item) => ({
            transactionDate:
              item.transactionDate,

            ledgerNumber:
              item.ledgerNumber,

            voucherNumber:
              item.voucherNumber,

            category:
              item.category,

            description:
              item.description,

            credit:
              item.creditAmount,

            debit:
              item.debitAmount,

            runningBalance:
              item.runningBalance,

            bankAccount:
              item.bankAccountId,
          })
        );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Cash book report fetched successfully",
        {
          openingBalance,
          closingBalance,
          totalCredit,
          totalDebit,
          totalCount,
          pageIndex:
            Number(pageIndex),
          pageSize:
            Number(pageSize),
          data,
        }
      );

    } catch (err) {

      logger.error(
        "getCashBookReport service error",
        {
          error:
            err.message,
          stack:
            err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };

exports.getDonationReport =
  async (filters) => {

    try {

      logger.info(
        "getDonationReport service started",
        { filters }
      );

      const {
        dharamshalaId,
        bankAccountId,
        fromDate,
        toDate,
        pageIndex = 0,
        pageSize = 10,
      } = filters;

      if (!dharamshalaId) {

        logger.warn(
          "getDonationReport validation failed : dharamshalaId missing"
        );

        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "Dharamshala Id is required",
          null
        );
      }

      const query = {
        dharamshalaId,
        category: "DONATION",
        transactionType: "CREDIT",
        status: "SUCCESS",
      };

      if (bankAccountId) {
        query.bankAccountId =
          bankAccountId;
      }

      if (
        fromDate ||
        toDate
      ) {

        query.transactionDate =
          {};

        if (fromDate) {
          query.transactionDate.$gte =
            new Date(fromDate);
        }

        if (toDate) {
          query.transactionDate.$lte =
            new Date(toDate);
        }
      }

      logger.info(
        "getDonationReport query built",
        query
      );

      const totalCount =
        await DharamshalaLedger.countDocuments(
          query
        );

      const donationSummary =
        await DharamshalaLedger.aggregate([
          {
            $match: {
              ...query,
            },
          },
          {
            $group: {
              _id: null,
              totalDonation: {
                $sum: "$amount",
              },
            },
          },
        ]);

      const totalDonation =
        donationSummary?.[0]
          ?.totalDonation || 0;

      const records =
        await DharamshalaLedger
          .find(query)
          .populate(
            "bankAccountId",
            "accountName bankName accountNumber"
          )
          .sort({
            transactionDate: -1,
          })
          .skip(
            Number(pageIndex) *
              Number(pageSize)
          )
          .limit(
            Number(pageSize)
          );

      logger.info(
        "getDonationReport records fetched",
        {
          count:
            records.length,
        }
      );

      const data =
        records.map(
          (item) => ({
            id: item._id,

            ledgerNumber:
              item.ledgerNumber,

            voucherNumber:
              item.voucherNumber,

            transactionDate:
              item.transactionDate,

            amount:
              item.amount,

            description:
              item.description,

            referenceNumber:
              item.referenceNumber,

            bankAccount:
              item.bankAccountId
                ? {
                    id: item
                      .bankAccountId
                      ._id,

                    accountName:
                      item
                        .bankAccountId
                        .accountName,

                    bankName:
                      item
                        .bankAccountId
                        .bankName,

                    accountNumber:
                      item
                        .bankAccountId
                        .accountNumber,
                  }
                : null,
          })
        );

      logger.info(
        "getDonationReport success",
        {
          totalDonation,
          totalCount,
        }
      );

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Donation report fetched successfully",
        {
          totalDonation,

          totalCount,

          pageIndex:
            Number(pageIndex),

          pageSize:
            Number(pageSize),

          records: data,
        }
      );

    } catch (err) {

      logger.error(
        "getDonationReport service error",
        {
          error:
            err.message,
          stack:
            err.stack,
        }
      );

      return buildResponse(
        DataConstant.SERVER_ERROR.SERVER_ERROR,
        err.message,
        null
      );
    }
  };