const financeService =
  require("../services/FinanceService");

const buildResponse =
  require("../utils/response");

const logger =
  require("../utils/logger");

const DataConstant =
  require("../constants/DataConstant");

/* ─────────────────────────────────────
   ADD / UPDATE BANK ACCOUNT
───────────────────────────────────── */

exports.addBankAccount =
  async (req, res) => {
    try {
      logger.info(
        "addBankAccount request",
        {
          body: req.body,
        }
      );

      const result =
        await financeService.addBankAccount(
          {
            ...req.body,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "addBankAccount controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

/* ─────────────────────────────────────
   GET BANK ACCOUNT BY ID
───────────────────────────────────── */

exports.getBankAccountById =
  async (req, res) => {
    try {
      const { id } = req.params;

      logger.info(
        `getBankAccountById request ${id}`
      );

      const result =
        await financeService.getBankAccountById(
          id
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "getBankAccountById controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

/* ─────────────────────────────────────
   GET ALL BANK ACCOUNTS
───────────────────────────────────── */

exports.getAllBankAccounts =
  async (req, res) => {
    try {
      let {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        status,
        isPrimary,
        searchText,
      } = req.query;

      pageIndex = parseInt(
        pageIndex,
        10
      );

      pageSize = parseInt(
        pageSize,
        10
      );

      searchText =
        typeof searchText ===
        "string"
          ? searchText.trim()
          : "";

      if (
        status !== undefined &&
        status !== ""
      ) {
        status = parseInt(
          status,
          10
        );
      }

      if (
        isPrimary !== undefined &&
        isPrimary !== ""
      ) {
        isPrimary =
          isPrimary === "true";
      }

      logger.info(
        "getAllBankAccounts request",
        {
          pageIndex,
          pageSize,
          dharamshalaId,
          status,
          isPrimary,
          searchText,
        }
      );

      const result =
        await financeService.getAllBankAccounts(
          {
            pageIndex,
            pageSize,
            dharamshalaId,
            status,
            isPrimary,
            searchText,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "getAllBankAccounts controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

/* ─────────────────────────────────────
   BLOCK / UNBLOCK BANK ACCOUNT
───────────────────────────────────── */

exports.blockUnblockBankAccount =
  async (req, res) => {
    try {
      const { id, status } =
        req.body;

      logger.info(
        "blockUnblockBankAccount request",
        {
          id,
          status,
        }
      );

      const result =
        await financeService.blockUnblockBankAccount(
          id,
          status
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "blockUnblockBankAccount controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


exports.addVoucher =
  async (req, res) => {
    try {
      logger.info(
        "addVoucher request",
        {
          body: req.body,
        }
      );

      const result =
        await financeService.addVoucher(
          {
            ...req.body,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "addVoucher controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.getVoucherById =
  async (req, res) => {
    try {
      const { id } = req.params;

      logger.info(
        `getVoucherById request ${id}`
      );

      const result =
        await financeService.getVoucherById(
          id
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "getVoucherById controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.getAllVouchers =
  async (req, res) => {
    try {
      let {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        voucherType,
        category,
        status,
        searchText,
        fromDate,
        toDate,
      } = req.query;

      pageIndex =
        parseInt(pageIndex, 10);

      pageSize =
        parseInt(pageSize, 10);

      searchText =
        typeof searchText ===
        "string"
          ? searchText.trim()
          : "";

      logger.info(
        "getAllVouchers request",
        {
          pageIndex,
          pageSize,
          dharamshalaId,
          voucherType,
          category,
          status,
          searchText,
          fromDate,
          toDate,
        }
      );

      const result =
        await financeService.getAllVouchers(
          {
            pageIndex,
            pageSize,
            dharamshalaId,
            voucherType,
            category,
            status,
            searchText,
            fromDate,
            toDate,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "getAllVouchers controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.updateVoucherStatus =
  async (req, res) => {
    try {
      logger.info(
        "updateVoucherStatus request",
        {
          body: req.body,
        }
      );

      const result =
        await financeService.updateVoucherStatus(
          {
            ...req.body,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "updateVoucherStatus controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


exports.createLedgerEntry =
  async (req, res) => {
    try {
      logger.info(
        "createLedgerEntry request",
        {
          body: req.body,
        }
      );

      const result =
        await financeService.createLedgerEntry(
          {
            ...req.body,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "createLedgerEntry controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.getLedgerById =
  async (req, res) => {
    try {
      const { id } = req.params;

      logger.info(
        `getLedgerById request ${id}`
      );

      const result =
        await financeService.getLedgerById(
          id
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {
      logger.error(
        "getLedgerById controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.getAllLedgerEntries =
  async (req, res) => {
    try {

      let {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        voucherId,
        bankAccountId,
        category,
        transactionType,
        fromDate,
        toDate,
        searchText,
      } = req.query;

      pageIndex =
        parseInt(pageIndex, 10);

      pageSize =
        parseInt(pageSize, 10);

      searchText =
        typeof searchText === "string"
          ? searchText.trim()
          : "";

      logger.info(
        "getAllLedgerEntries request",
        {
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
        }
      );

      const result =
        await financeService.getAllLedgerEntries(
          {
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
          }
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {
      logger.error(
        "getAllLedgerEntries controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


  exports.getAdvanceOutstanding =
  async (req, res) => {
    try {
      let {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        committeeMemberId,
      } = req.query;

      pageIndex =
        parseInt(pageIndex, 10);

      pageSize =
        parseInt(pageSize, 10);

      logger.info(
        "getAdvanceOutstanding request",
        {
          pageIndex,
          pageSize,
          dharamshalaId,
          committeeMemberId,
        }
      );

      const result =
        await financeService.getAdvanceOutstanding(
          {
            pageIndex,
            pageSize,
            dharamshalaId,
            committeeMemberId,
          }
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {

      logger.error(
        "getAdvanceOutstanding controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

  exports.getBankBalance =
  async (req, res) => {
    try {

      const { bankAccountId } =
        req.params;

      logger.info(
        `getBankBalance request ${bankAccountId}`
      );

      const result =
        await financeService.getBankBalance(
          bankAccountId
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {

      logger.error(
        "getBankBalance controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


  exports.getFinanceDashboard =
  async (req, res) => {
    try {

      const {
        dharamshalaId,
      } = req.query;

      logger.info(
        "getFinanceDashboard request",
        {
          dharamshalaId,
        }
      );

      const result =
        await financeService.getFinanceDashboard(
          dharamshalaId
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {

      logger.error(
        "getFinanceDashboard controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


exports.getBankStatement =
  async (req, res) => {
    try {
      let {
        dharamshalaId,
        bankAccountId,
        fromDate,
        toDate,
        pageIndex = 0,
        pageSize = 10,
      } = req.query;

      pageIndex = parseInt(
        pageIndex,
        10
      );

      pageSize = parseInt(
        pageSize,
        10
      );

      logger.info(
        "getBankStatement request",
        {
          dharamshalaId,
          bankAccountId,
          fromDate,
          toDate,
          pageIndex,
          pageSize,
        }
      );

      const result =
        await financeService.getBankStatement(
          {
            dharamshalaId,
            bankAccountId,
            fromDate,
            toDate,
            pageIndex,
            pageSize,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "getBankStatement controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


/* ─────────────────────────────────────
   ADD EXPENSE
───────────────────────────────────── */

exports.addExpense =
  async (req, res) => {
    try {

      logger.info(
        "addExpense request",
        {
          body: req.body,
        }
      );

      const result =
        await financeService.addExpense(
          {
            ...req.body,
          }
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {

      logger.error(
        "addExpense controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.getExpenseById =
  async (req, res) => {
    try {

      const { id } =
        req.params;

      logger.info(
        "getExpenseById request",
        { id }
      );

      const result =
        await financeService.getExpenseById(
          id
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {

      logger.error(
        "getExpenseById controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.getAllExpenses =
  async (req, res) => {
    try {

      let {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        expenseType,
        voucherId,
        searchText,
        fromDate,
        toDate,
      } = req.query;

      pageIndex =
        parseInt(pageIndex, 10);

      pageSize =
        parseInt(pageSize, 10);

      logger.info(
        "getAllExpenses request",
        {
          pageIndex,
          pageSize,
          dharamshalaId,
          expenseType,
          voucherId,
          searchText,
          fromDate,
          toDate,
        }
      );

      const result =
        await financeService.getAllExpenses(
          {
            pageIndex,
            pageSize,
            dharamshalaId,
            expenseType,
            voucherId,
            searchText,
            fromDate,
            toDate,
          }
        );

      return res
        .status(200)
        .json(result);

    } catch (err) {

      logger.error(
        "getAllExpenses controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };

exports.getCommitteeMemberAdvanceSummary =
  async (req, res) => {

    try {

      logger.info(
        "getCommitteeMemberAdvanceSummary request",
        {
          query:
            req.query,
        }
      );

      const response =
        await financeService.getCommitteeMemberAdvanceSummary(
          req.query
        );

      return res
        .status(200)
        .json(response);

    } catch (err) {

      logger.error(
        "getCommitteeMemberAdvanceSummary controller error",
        {
          error:
            err.message,
          stack:
            err.stack,
        }
      );

      return res
        .status(500)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


  exports.getCommitteeMemberAdvanceDetails =
  async (req, res) => {

    try {

      logger.info(
        "getCommitteeMemberAdvanceDetails request",
        {
          query:
            req.query,
        }
      );

      const response =
        await financeService.getCommitteeMemberAdvanceDetails(
          req.query
        );

      return res
        .status(200)
        .json(response);

    } catch (err) {

      logger.error(
        "getCommitteeMemberAdvanceDetails controller error",
        {
          error:
            err.message,
          stack:
            err.stack,
        }
      );

      return res
        .status(500)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


exports.getExpenseReport =
  async (req, res) => {

    try {

      logger.info(
        "getExpenseReport request",
        {
          query:
            req.query,
        }
      );

      const response =
        await financeService.getExpenseReport(
          req.query
        );

      return res
        .status(200)
        .json(response);

    } catch (err) {

      logger.error(
        "getExpenseReport controller error",
        {
          error:
            err.message,
          stack:
            err.stack,
        }
      );

      return res
        .status(500)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


exports.getCashBookReport =
  async (req, res) => {

    try {

      logger.info(
        "getCashBookReport request",
        {
          query: req.query,
        }
      );

      const response =
        await financeService.getCashBookReport(
          req.query
        );

      return res
        .status(200)
        .json(response);

    } catch (err) {

      logger.error(
        "getCashBookReport controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(500)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };


  exports.getDonationReport =
  async (req, res) => {

    try {

      logger.info(
        "getDonationReport request",
        {
          query: req.query,
        }
      );

      const response =
        await financeService.getDonationReport(
          req.query
        );

      return res
        .status(200)
        .json(response);

    } catch (err) {

      logger.error(
        "getDonationReport controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(500)
        .json(
          buildResponse(
            DataConstant.SERVER_ERROR.SERVER_ERROR,
            err.message,
            null
          )
        );
    }
  };