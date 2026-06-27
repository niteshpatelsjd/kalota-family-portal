// services/DonationService.js

const mongoose = require("mongoose");
const InventorySyncService = require("./InventorySyncService");
const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );
const DharamshalaDonation = require("../models/DharamshalaDonation");
const DharamshalaVoucher = require("../models/DharamshalaVoucher");
const DharamshalaLedger = require("../models/DharamshalaLedger");
const DharamshalaBankAccount = require("../models/DharamshalaBankAccount");


const buildResponse = require("../utils/response");
const logger = require("../utils/logger");

const DataConstant = require("../constants/DataConstant");
const {
  generateReceiptNumber,
  generateVoucherNumber,
  generateLedgerNumber,
} = require("../utils/NumberGenerater");


async function createDonation(body, userId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      dharamshalaId,
      donorType,
      donorUserId,
      externalDonorName,
      externalMobileNumber,
      externalAddress,
      donationSource = "COMMITTEE_COLLECTION",
      donationType,
      amount,
      itemName,
      quantity,
      purpose,
      paymentMode,
      transactionReference,
      collectedBy,
      familyId,
      bankAccountId,
      remarks,
    } = body;

    if (!dharamshalaId) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "dharamshalaId is required"
      );
    }

    if (!donorType) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "donorType is required"
      );
    }

    if (!["REGISTERED_MEMBER", "EXTERNAL_DONOR"].includes(donorType)) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid donorType"
      );
    }

    if (donorType === "REGISTERED_MEMBER" && !donorUserId) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "donorUserId is required"
      );
    }

    if (donorType === "EXTERNAL_DONOR" && !externalDonorName) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "externalDonorName is required"
      );
    }

    if (
      !["ONLINE", "COMMITTEE_COLLECTION", "DIRECT_OFFICE"].includes(
        donationSource
      )
    ) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid donationSource"
      );
    }

    if (!donationType) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "donationType is required"
      );
    }

    if (!["MONEY", "ITEM"].includes(donationType)) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid donationType"
      );
    }

    if (donationType === "MONEY" && (!amount || Number(amount) <= 0)) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "amount is required"
      );
    }

    if (
      donationType === "ITEM" &&
      (!itemName || !quantity || Number(quantity) <= 0)
    ) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "itemName and quantity are required"
      );
    }

    if (!purpose) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "purpose is required"
      );
    }

    if (donationType === "MONEY" && !paymentMode) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "paymentMode is required"
      );
    }

    if (donationType === "ITEM" && paymentMode && paymentMode !== "NA") {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "paymentMode must be NA for item donation"
      );
    }

    const isOnlineMoney =
      donationSource === "ONLINE" && donationType === "MONEY";

    const isCommitteeMoney =
      donationSource === "COMMITTEE_COLLECTION" && donationType === "MONEY";

    const isDirectOfficeMoney =
      donationSource === "DIRECT_OFFICE" && donationType === "MONEY";

    const isItemDonation = donationType === "ITEM";

    if (isOnlineMoney && !bankAccountId) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "bankAccountId is required for online donation"
      );
    }

    const finalPaymentMode = isItemDonation ? "NA" : paymentMode;

    const collectionStatus = isOnlineMoney
      ? "NOT_REQUIRED"
      : isCommitteeMoney || isDirectOfficeMoney || isItemDonation
        ? "COLLECTED"
        : "NOT_COLLECTED";

    const depositStatus = isOnlineMoney
      ? "DEPOSITED"
      : isCommitteeMoney || isDirectOfficeMoney
        ? "PENDING"
        : "NOT_REQUIRED";

    const itemStatus = isItemDonation ? "PENDING_VERIFICATION" : "NOT_REQUIRED";

    const receiptNumber = await generateReceiptNumber();
    const voucherNumber = await generateVoucherNumber();

    let bankAccount = null;
    let newBalance = 0;

    if (isOnlineMoney) {
      bankAccount = await DharamshalaBankAccount.findById(bankAccountId).session(
        session
      );

      if (!bankAccount) {
        await session.abortTransaction();
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Bank account not found"
        );
      }

      newBalance =
        Number(bankAccount.currentBalance || 0) + Number(amount || 0);
    }

    const donationResult = await DharamshalaDonation.create(
      [
        {
          dharamshalaId,
          receiptNumber,

          donorType,
          donorUserId: donorType === "REGISTERED_MEMBER" ? donorUserId : null,
          externalDonorName:
            donorType === "EXTERNAL_DONOR" ? externalDonorName : "",
          externalMobileNumber:
            donorType === "EXTERNAL_DONOR" ? externalMobileNumber : "",
          externalAddress:
            donorType === "EXTERNAL_DONOR" ? externalAddress : "",

          familyId: familyId || null,

          donationSource,
          donationType,

          amount: donationType === "MONEY" ? Number(amount) : 0,
          itemName: donationType === "ITEM" ? itemName : "",
          quantity: donationType === "ITEM" ? Number(quantity) : 0,
          receivedQuantity: 0,

          purpose,
          paymentMode: finalPaymentMode,
          transactionReference: transactionReference || "",

          collectedBy: collectedBy || null,

          collectionStatus,
          depositStatus,
          itemStatus,

          bankAccountId: isOnlineMoney ? bankAccountId : null,

          remarks: remarks || "",
          createdBy: userId || null,
        },
      ],
      { session }
    );

    const savedDonation = donationResult[0];

    const voucherResult = await DharamshalaVoucher.create(
      [
        {
          dharamshalaId,
          voucherNumber,
          voucherType: "RECEIPT",
          category: "DONATION",
          purpose,
          requestedAmount: donationType === "MONEY" ? Number(amount) : 0,
          requestedBy: userId || null,
          remarks: remarks || "",
          status: "APPROVED",
          approvedBy: userId || null,
          approvedAmount: donationType === "MONEY" ? Number(amount) : 0,
          approvedDate: new Date(),
          createdBy: userId || null,
        },
      ],
      { session }
    );

    const voucher = voucherResult[0];

    let ledger = null;

    if (isOnlineMoney) {
      const donationAmount = Number(amount || 0);
      const ledgerNumber = await generateLedgerNumber();

      const ledgerResult = await DharamshalaLedger.create(
        [
          {
            dharamshalaId,
            bankAccountId,
            voucherId: voucher._id,

            voucherNumber: voucher.voucherNumber,
            ledgerNumber,

            transactionType: "CREDIT",
            category: "DONATION",

            amount: donationAmount,
            creditAmount: donationAmount,
            debitAmount: 0,
            runningBalance: newBalance,

            transactionDate: new Date(),
            description: `Online donation received - ${receiptNumber}`,
            referenceNumber: transactionReference || receiptNumber,

            fromAccountType: "MEMBER",
            fromAccountId: donorUserId || null,
            toAccountType: "BANK",
            toAccountId: bankAccountId,

            createdBy: userId || null,
          },
        ],
        { session }
      );

      ledger = ledgerResult[0];

      bankAccount.currentBalance = newBalance;
      await bankAccount.save({ session });
    }

    savedDonation.voucherId = voucher._id;

    if (ledger) {
      savedDonation.ledgerId = ledger._id;
      savedDonation.verifiedBy = userId || null;
      savedDonation.verifiedAt = new Date();
    }

    await savedDonation.save({ session });

    await session.commitTransaction();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Donation created successfully",
      savedDonation
    );
  } catch (error) {
    await session.abortTransaction();

    logger.error(`createDonation error: ${error.message}`);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Failed to create donation"
    );
  } finally {
    session.endSession();
  }
}

async function getAllDonations(query) {
  try {
    const {
      pageIndex = 0,
      pageSize = 10,

      dharamshalaId,
      donorType,
      donorUserId,
      donationSource,
      donationType,
      paymentMode,

      collectionStatus,
      depositStatus,
      itemStatus,

      collectedBy,
      verifiedBy,
      familyId,

      status = 1,
      searchText = "",
    } = query;

    const filter = {};

    if (dharamshalaId) filter.dharamshalaId = dharamshalaId;
    if (donorType) filter.donorType = donorType;
    if (donorUserId) filter.donorUserId = donorUserId;
    if (donationSource) filter.donationSource = donationSource;
    if (donationType) filter.donationType = donationType;
    if (paymentMode) filter.paymentMode = paymentMode;

    if (collectionStatus) filter.collectionStatus = collectionStatus;
    if (depositStatus) filter.depositStatus = depositStatus;
    if (itemStatus) filter.itemStatus = itemStatus;

    if (collectedBy) filter.collectedBy = collectedBy;
    if (verifiedBy) filter.verifiedBy = verifiedBy;
    if (familyId) filter.familyId = familyId;

    if (status !== "") filter.status = Number(status);

    if (searchText) {
      filter.$or = [
        { receiptNumber: { $regex: searchText, $options: "i" } },
        { externalDonorName: { $regex: searchText, $options: "i" } },
        { externalMobileNumber: { $regex: searchText, $options: "i" } },
        { purpose: { $regex: searchText, $options: "i" } },
        { itemName: { $regex: searchText, $options: "i" } },
        { transactionReference: { $regex: searchText, $options: "i" } },
        { remarks: { $regex: searchText, $options: "i" } },
      ];
    }

    const skip = Number(pageIndex) * Number(pageSize);

    const [content, totalElements] = await Promise.all([
      DharamshalaDonation.find(filter)
        .populate("dharamshalaId", "name address")
        .populate(
          "donorUserId",
          "name firstName lastName mobileNumber familyId profileImage"
        )
        .populate("collectedBy", "name mobileNumber profileUrl")
        .populate("verifiedBy", "name mobileNumber profileUrl")
        
        .populate("bankAccountId", "accountName bankName accountNumber ifscCode")
        .populate("voucherId", "voucherNumber voucherType category status approvedAmount")
        .populate("ledgerId", "ledgerNumber transactionType amount transactionDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),

      DharamshalaDonation.countDocuments(filter),
    ]);

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Records fetched successfully",
      {
        content,
        pageIndex: Number(pageIndex),
        pageSize: Number(pageSize),
        totalElements,
        totalPages: Math.ceil(totalElements / Number(pageSize)),
      }
    );
  } catch (error) {
    logger.error(`getAllDonations error: ${error.message}`);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Failed to fetch donations"
    );
  }
}

async function getDonationById(id) {
  try {
    if (!id) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "id is required");
    }

    const donation = await DharamshalaDonation.findById(id)
      .populate("dharamshalaId", "name address mobileNumber")
      .populate(
        "donorUserId",
        "name firstName lastName mobileNumber familyId profileImage"
      )
      .populate("collectedBy", "name mobileNumber profileUrl")
      .populate("verifiedBy", "name mobileNumber profileUrl")
      
      .populate("bankAccountId", "accountName bankName accountNumber ifscCode")
      .populate("voucherId")
      .populate("ledgerId");

    if (!donation) {
      return buildResponse(DataConstant.CLIENT_ERROR.NOT_FOUND, "Donation not found");
    }

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Donation fetched successfully",
      donation
    );
  } catch (error) {
    logger.error(`getDonationById error: ${error.message}`);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Failed to fetch donation"
    );
  }
}

async function cancelDonation(body) {
  const {
    donationId,
    userId,
    remarks,
  } = body;
  try {
    if (!donationId) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "donationId is required");
    }

    const donation = await DharamshalaDonation.findById(donationId);

    if (!donation) {
      return buildResponse(DataConstant.CLIENT_ERROR.NOT_FOUND, "Donation not found");
    }

    donation.status = 2;
    donation.updatedBy = userId || null;
    donation.remarks = body.remarks || donation.remarks;

    await donation.save();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Donation cancelled successfully",
      donation
    );
  } catch (error) {
    logger.error(`cancelDonation error: ${error.message}`);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Failed to cancel donation"
    );
  }
}

async function depositCashDonation(body, file) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      donationId,
      bankAccountId,
      referenceNumber = "",
      remarks = "",
      updatedBy = null,
    } = body;

    if (!donationId) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "donationId is required"
      );
    }

    if (!bankAccountId) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "bankAccountId is required"
      );
    }

    const donation = await DharamshalaDonation.findById(donationId).session(
      session
    );

    if (!donation) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Donation not found"
      );
    }

    if (donation.donationType !== "MONEY") {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Only money donation can be deposited"
      );
    }

    if (donation.depositStatus !== "PENDING") {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        `Donation already ${donation.depositStatus}`
      );
    }

    const bankAccount = await DharamshalaBankAccount.findById(
      bankAccountId
    ).session(session);

    if (!bankAccount) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Bank account not found"
      );
    }

    let bankReceiptUrl = "";

    if (file) {
      const uploaded = await uploadToCloudinary(
        file.path,
        "kalota/deposit-receipts"
      );

      bankReceiptUrl = uploaded?.url || "";
    }

    const voucher = await DharamshalaVoucher.findById(
      donation.voucherId
    ).session(session);

    if (!voucher) {
      await session.abortTransaction();
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Voucher not found"
      );
    }

    const donationAmount = Number(donation.amount || 0);
    const currentBalance = Number(bankAccount.currentBalance || 0);
    const newBalance = currentBalance + donationAmount;

    const ledgerNumber = await generateLedgerNumber();

    const ledger = await DharamshalaLedger.create(
      [
        {
          dharamshalaId: donation.dharamshalaId,
          bankAccountId,
          voucherId: donation.voucherId,

          voucherNumber: voucher.voucherNumber,
          ledgerNumber,

          transactionType: "CREDIT",
          category: "DONATION",

          amount: donationAmount,
          creditAmount: donationAmount,
          debitAmount: 0,
          runningBalance: newBalance,

          transactionDate: new Date(),
          description: `Donation Deposit - ${donation.receiptNumber}`,
          committeeMemberId: donation.collectedBy,
          referenceNumber,

          fromAccountType: "MEMBER",
          fromAccountId: donation.donorUserId || null,
          toAccountType: "BANK",
          toAccountId: bankAccountId,

          createdBy: updatedBy,
        },
      ],
      { session }
    );

    bankAccount.currentBalance = newBalance;
    await bankAccount.save({ session });

    donation.depositStatus = "DEPOSITED";
    donation.bankAccountId = bankAccountId;
    donation.bankReceiptUrl = bankReceiptUrl;
    donation.ledgerId = ledger[0]._id;
    donation.verifiedBy = updatedBy;
    donation.verifiedAt = new Date();
    donation.remarks = remarks || donation.remarks;
    donation.updatedBy = updatedBy;

    await donation.save({ session });

    await session.commitTransaction();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Donation deposited successfully",
      {
        donation,
        ledger: ledger[0],
      }
    );
  } catch (error) {
    await session.abortTransaction();

    logger.error(`depositCashDonation error: ${error.message}`);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Failed to deposit donation"
    );
  } finally {
    session.endSession();
  }
}

async function verifyItemDonation(body) {
  try {
    const {
      donationId,
      itemStatus,
      receivedQuantity = 0,
      notReceivedReason = "",
      remarks = "",
      updatedBy = null,
    } = body;

    if (!donationId) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "donationId is required");
    }

    if (!itemStatus) {
      return buildResponse(DataConstant.CLIENT_ERROR.BAD_REQUEST, "itemStatus is required");
    }

    const allowedStatuses = [
      "RECEIVED",
      "PARTIALLY_RECEIVED",
      "NOT_RECEIVED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(itemStatus)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Invalid itemStatus"
      );
    }

    const donation = await DharamshalaDonation.findById(donationId);

    if (!donation) {
      return buildResponse(DataConstant.CLIENT_ERROR.NOT_FOUND, "Donation not found");
    }

    if (donation.donationType !== "ITEM") {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Only item donation can be verified here"
      );
    }

    if (
      donation.itemStatus !== "PENDING_VERIFICATION" &&
      donation.itemStatus !== "PENDING"
    ) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        `Item donation already ${donation.itemStatus}`
      );
    }

    if (itemStatus === "RECEIVED") {
      if (!receivedQuantity || receivedQuantity <= 0) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "receivedQuantity is required"
        );
      }

      if (receivedQuantity !== donation.quantity) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "For RECEIVED, receivedQuantity must match donation quantity"
        );
      }
    }

    if (itemStatus === "PARTIALLY_RECEIVED") {
      if (!receivedQuantity || receivedQuantity <= 0) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "receivedQuantity is required"
        );
      }

      if (receivedQuantity >= donation.quantity) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.BAD_REQUEST,
          "For PARTIALLY_RECEIVED, receivedQuantity must be less than donation quantity"
        );
      }
    }

    if (itemStatus === "NOT_RECEIVED" && !notReceivedReason) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "notReceivedReason is required"
      );
    }

    donation.itemStatus = itemStatus;

    donation.receivedQuantity =
      itemStatus === "RECEIVED" || itemStatus === "PARTIALLY_RECEIVED"
        ? receivedQuantity
        : 0;

    donation.notReceivedReason =
      itemStatus === "NOT_RECEIVED" ? notReceivedReason : "";

    donation.depositStatus = "NOT_REQUIRED";
    donation.verifiedBy = updatedBy;
    donation.verifiedAt = new Date();
    donation.remarks = remarks || donation.remarks;
    donation.updatedBy = updatedBy;

    if (itemStatus === "CANCELLED") {
      donation.status = 2;
      donation.cancelReason = remarks || "Item donation cancelled";
    }

    await donation.save();

    if (
  donation.itemStatus === "RECEIVED" ||
  donation.itemStatus === "PARTIALLY_RECEIVED"
) {
  await InventorySyncService.syncDonationItemToAssetOrInventory(donation._id);
}
    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Item donation verified successfully",
      donation
    );
  } catch (error) {
    logger.error(`verifyItemDonation error: ${error.message}`);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Failed to verify item donation"
    );
  }
}
module.exports = {
  createDonation,
  getAllDonations,
  getDonationById,
  cancelDonation,
  depositCashDonation,
  verifyItemDonation,
};