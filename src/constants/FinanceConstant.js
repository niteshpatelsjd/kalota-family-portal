module.exports = {
  STATUS: {
    DELETED: 0,
    ACTIVE: 1,
    INACTIVE: 2,
  },

  VOUCHER_STATUS: {
    DRAFT: "DRAFT",
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    PARTIALLY_SETTLED: "PARTIALLY_SETTLED",
    SETTLED: "SETTLED",
    CANCELLED: "CANCELLED",
  },

  ADVANCE_STATUS: {
    OPEN: "OPEN",
    PARTIALLY_SETTLED:
      "PARTIALLY_SETTLED",
    SETTLED: "SETTLED",
    CANCELLED: "CANCELLED",
  },

  LEDGER_STATUS: {
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    REVERSED: "REVERSED",
  },

  TRANSACTION_TYPE: {
    CREDIT: "CREDIT",
    DEBIT: "DEBIT",
  },

  VOUCHER_TYPE: {
    RECEIPT: "RECEIPT",
    PAYMENT: "PAYMENT",
    JOURNAL: "JOURNAL",
  },

  CATEGORY: {
    DONATION: "DONATION",
    ADVANCE: "ADVANCE",
    EXPENSE: "EXPENSE",
    RETURN: "RETURN",
    REIMBURSEMENT:
      "REIMBURSEMENT",
    BANK_CHARGE: "BANK_CHARGE",
    BANK_INTEREST:
      "BANK_INTEREST",
    ADJUSTMENT: "ADJUSTMENT",
    OPENING_BALANCE:
      "OPENING_BALANCE",
    OTHER: "OTHER",
  },

  ACCOUNT_TYPE: {
    BANK: "BANK",
    MEMBER: "MEMBER",
    DONOR: "DONOR",
    VENDOR: "VENDOR",
    SYSTEM: "SYSTEM",
  },

  BANK_ACCOUNT_TYPE: {
    SAVINGS: "SAVINGS",
    CURRENT: "CURRENT",
    TRUST: "TRUST",
    OTHER: "OTHER",
  },

  MESSAGES: {


    LEDGER_CREATED:
  "Ledger entry created successfully",

LEDGER_NOT_FOUND:
  "Ledger entry not found",

BANK_ACCOUNT_NOT_FOUND:
  "Bank account not found",

INSUFFICIENT_BANK_BALANCE:
  "Insufficient bank balance",

VOUCHER_NOT_APPROVED:
  "Voucher must be approved before creating ledger entry",

    VOUCHER_APPROVED:
  "Voucher approved successfully",

VOUCHER_REJECTED:
  "Voucher rejected successfully",

VOUCHER_CANCELLED:
  "Voucher cancelled successfully",

INVALID_VOUCHER_STATUS:
  "Invalid voucher status",

VOUCHER_ALREADY_PROCESSED:
  "Voucher already processed",
        VOUCHER_CREATED:
      "Voucher created successfully",

    VOUCHER_NOT_FOUND:
      "Voucher not found",
    BANK_ACCOUNT_CREATED:
      "Bank account created successfully !!",

    BANK_ACCOUNT_UPDATED:
      "Bank account updated successfully !!",

    BANK_ACCOUNT_NOT_FOUND:
      "Bank account not found !!",

    BANK_ACCOUNT_ALREADY_EXISTS:
      "Bank account already exists !!",

    BANK_ACCOUNT_ACTIVE:
      "Bank account activated successfully !!",

    BANK_ACCOUNT_INACTIVE:
      "Bank account inactivated successfully !!",

    VOUCHER_CREATED:
      "Voucher created successfully !!",

    VOUCHER_UPDATED:
      "Voucher updated successfully !!",

    VOUCHER_APPROVED:
      "Voucher approved successfully !!",

    VOUCHER_REJECTED:
      "Voucher rejected successfully !!",

    ADVANCE_CREATED:
      "Advance created successfully !!",

    ADVANCE_SETTLED:
      "Advance settled successfully !!",

    DONATION_CREATED:
      "Donation created successfully !!",

    DONATION_DEPOSITED:
      "Donation deposited successfully !!",

    EXPENSE_CREATED:
      "Expense created successfully !!",

    SETTLEMENT_CREATED:
      "Settlement created successfully !!",
  },
};