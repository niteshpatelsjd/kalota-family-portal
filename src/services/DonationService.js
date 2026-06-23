// services/DonationService.js

const mongoose = require("mongoose");

const DharamshalaDonation = require("../models/DharamshalaDonation");
const DharamshalaVoucher = require("../models/DharamshalaVoucher");
const DharamshalaLedger = require("../models/DharamshalaLedger");

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
      donationType,
      amount,
      itemName,
      quantity,
      purpose,
      paymentMode,
      transactionReference,
      collectedBy,
      familyId,
      remarks,
    } = body;

    if (!dharamshalaId) {
      return buildResponse(DataConstant.BAD_REQUEST, "dharamshalaId is required");
    }

    if (!donorType) {
      return buildResponse(DataConstant.BAD_REQUEST, "donorType is required");
    }

    if (donorType === "REGISTERED_MEMBER" && !donorUserId) {
      return buildResponse(DataConstant.BAD_REQUEST, "donorUserId is required");
    }

    if (donorType === "EXTERNAL_DONOR" && !externalDonorName) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "externalDonorName is required"
      );
    }

    if (!donationType) {
      return buildResponse(DataConstant.BAD_REQUEST, "donationType is required");
    }

    if (donationType === "MONEY" && (!amount || Number(amount) <= 0)) {
      return buildResponse(DataConstant.BAD_REQUEST, "amount is required");
    }

    if (donationType === "ITEM" && (!itemName || !quantity)) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "itemName and quantity are required"
      );
    }

    if (!purpose) {
      return buildResponse(DataConstant.BAD_REQUEST, "purpose is required");
    }

    if (!paymentMode) {
      return buildResponse(DataConstant.BAD_REQUEST, "paymentMode is required");
    }

    const receiptNumber = await generateReceiptNumber();
    const voucherNumber = await generateVoucherNumber();

    const donation = await DharamshalaDonation.create(
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
          donationType,
          amount: donationType === "MONEY" ? amount : 0,
          itemName: donationType === "ITEM" ? itemName : "",
          quantity: donationType === "ITEM" ? quantity : 0,
          purpose,
          paymentMode,
          transactionReference,
          collectedBy: collectedBy || null,
          familyId: familyId || null,
          depositStatus: paymentMode === "CASH" ? "PENDING" : "DEPOSITED",
          remarks,
          createdBy: userId || null,
        },
      ],
      { session }
    );

    const savedDonation = donation[0];

    const voucher = await DharamshalaVoucher.create(
      [
        {
          dharamshalaId,
          voucherNumber,
          voucherType: "RECEIPT",
          category: "DONATION",
          purpose,
          requestedAmount: donationType === "MONEY" ? amount : 0,
          requestedBy: userId || null,
          remarks,
          status: "APPROVED",
          approvedBy: userId || null,
          approvedAmount: donationType === "MONEY" ? amount : 0,
          approvedDate: new Date(),
          createdBy: userId || null,
        },
      ],
      { session }
    );

    let ledger = null;

    if (donationType === "MONEY" && paymentMode !== "CASH") {
      const ledgerNumber = await generateLedgerNumber();

      const ledgerResult = await DharamshalaLedger.create(
        [
          {
            dharamshalaId,
            voucherId: voucher[0]._id,
            voucherNumber: voucher[0].voucherNumber,
            ledgerNumber,
            transactionType: "CREDIT",
            category: "DONATION",
            amount,
            transactionDate: new Date(),
            description: `Donation received - ${receiptNumber}`,
            referenceNumber: transactionReference || receiptNumber,
            fromAccountType: "MEMBER",
            toAccountType: "BANK",
            createdBy: userId || null,
          },
        ],
        { session }
      );

      ledger = ledgerResult[0];
    }

    savedDonation.voucherId = voucher[0]._id;

    if (ledger) {
      savedDonation.ledgerId = ledger._id;
    }

    await savedDonation.save({ session });

    await session.commitTransaction();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Donation created SUCCESS.OK.OKfully",
      savedDonation
    );
  } catch (error) {
    await session.abortTransaction();

    logger.error(`createDonation error: ${error.message}`);

    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
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
      donationType,
      paymentMode,
      depositStatus,
      status = 1,
      searchText = "",
      donorUserId,
    } = query;

    const filter = {};

    if (dharamshalaId) filter.dharamshalaId = dharamshalaId;
    if (donorType) filter.donorType = donorType;
    if (donationType) filter.donationType = donationType;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (depositStatus) filter.depositStatus = depositStatus;
    if (donorUserId) filter.donorUserId = donorUserId;
    if (status !== "") filter.status = Number(status);

    if (searchText) {
      filter.$or = [
        { receiptNumber: { $regex: searchText, $options: "i" } },
        { externalDonorName: { $regex: searchText, $options: "i" } },
        { externalMobileNumber: { $regex: searchText, $options: "i" } },
        { purpose: { $regex: searchText, $options: "i" } },
      ];
    }

    const skip = Number(pageIndex) * Number(pageSize);

    const [content, totalElements] = await Promise.all([
      DharamshalaDonation.find(filter)
        .populate("dharamshalaId", "name")
        .populate("donorUserId", "name firstName lastName mobileNumber familyId")
        .populate("collectedBy", "name mobileNumber")
        //.populate("familyId", "familyId familyTitle")
        .populate("voucherId", "voucherNumber status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      DharamshalaDonation.countDocuments(filter),
    ]);

    return buildResponse(DataConstant.SUCCESS.OK, "Records fetched SUCCESS.OKfully", {
      content,
      pageIndex: Number(pageIndex),
      pageSize: Number(pageSize),
      totalElements,
      totalPages: Math.ceil(totalElements / Number(pageSize)),
    });
  } catch (error) {
    logger.error(`getAllDonations error: ${error.message}`);

    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to fetch donations"
    );
  }
}

async function getDonationById(id) {
  try {
    if (!id) {
      return buildResponse(DataConstant.BAD_REQUEST, "id is required");
    }

    const donation = await DharamshalaDonation.findById(id)
      .populate("dharamshalaId", "name address")
      .populate("donorUserId", "name firstName lastName mobileNumber familyId")
      .populate("collectedBy", "name mobileNumber")
      //.populate("familyId", "familyId familyTitle")
      .populate("voucherId")
      .populate("ledgerId");

    if (!donation) {
      return buildResponse(DataConstant.NOT_FOUND, "Donation not found");
    }

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Donation fetched successfully",
      donation
    );
  } catch (error) {
    logger.error(`getDonationById error: ${error.message}`);

    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to fetch donation"
    );
  }
}

async function cancelDonation(id, body, userId) {
  try {
    if (!id) {
      return buildResponse(DataConstant.BAD_REQUEST, "id is required");
    }

    const donation = await DharamshalaDonation.findById(id);

    if (!donation) {
      return buildResponse(DataConstant.NOT_FOUND, "Donation not found");
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
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to cancel donation"
    );
  }
}

module.exports = {
  createDonation,
  getAllDonations,
  getDonationById,
  cancelDonation,
};