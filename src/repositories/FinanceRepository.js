const DharamshalaBankAccount =
  require("../models/DharamshalaBankAccount");

/* ─────────────────────────────────────
   CREATE
───────────────────────────────────── */

exports.createBankAccount =
  async (data) => {
    return DharamshalaBankAccount.create(
      data
    );
  };

/* ─────────────────────────────────────
   UPDATE
───────────────────────────────────── */

exports.updateBankAccount =
  async (id, data) => {
    return DharamshalaBankAccount.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
      }
    );
  };

/* ─────────────────────────────────────
   GET BY ID
───────────────────────────────────── */

exports.findBankAccountById =
  async (id) => {
    return DharamshalaBankAccount.findById(
      id
    );
  };

/* ─────────────────────────────────────
   FIND DUPLICATE ACCOUNT
───────────────────────────────────── */

exports.findBankAccountByAccountNumber =
  async (
    dharamshalaId,
    accountNumber
  ) => {
    return DharamshalaBankAccount.findOne(
      {
        dharamshalaId,
        accountNumber,
        status: {
          $ne: 0,
        },
      }
    );
  };

/* ─────────────────────────────────────
   REMOVE PRIMARY FROM OTHERS
───────────────────────────────────── */

exports.removePrimaryFromOthers =
  async (
    dharamshalaId,
    excludeId = null
  ) => {
    const filter = {
      dharamshalaId,
      isPrimary: true,
    };

    if (excludeId) {
      filter._id = {
        $ne: excludeId,
      };
    }

    return DharamshalaBankAccount.updateMany(
      filter,
      {
        $set: {
          isPrimary: false,
        },
      }
    );
  };

/* ─────────────────────────────────────
   GET ALL
───────────────────────────────────── */

exports.getAllBankAccounts =
  async (
    filter,
    skip,
    limit
  ) => {
    return DharamshalaBankAccount.find(
      filter
    )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);
  };

/* ─────────────────────────────────────
   COUNT
───────────────────────────────────── */

exports.countBankAccounts =
  async (filter) => {
    return DharamshalaBankAccount.countDocuments(
      filter
    );
  };

exports.updateCurrentBalance =
  async (
    bankAccountId,
    amount
  ) => {
    return DharamshalaBankAccount.findByIdAndUpdate(
      bankAccountId,
      {
        $inc: {
          currentBalance: amount,
        },
      },
      {
        new: true,
      }
    );
  };