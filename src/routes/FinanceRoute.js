const express =
  require("express");

const router =
  express.Router();

const financeController =
  require("../controllers/FinanceController");

/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Dharamshala Finance Management APIs
 */

/* ─────────────────────────────────────
   ADD / UPDATE BANK ACCOUNT
───────────────────────────────────── */

/**
 * @swagger
 * /admin/finance/addBankAccount:
 *   post:
 *     summary: Create or Update Bank Account
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: 6851d6f3d2ab12e0d9f8b123
 *               dharamshalaId:
 *                 type: string
 *                 example: 6851d6f3d2ab12e0d9f8b456
 *               accountName:
 *                 type: string
 *                 example: Main SBI Account
 *               bankName:
 *                 type: string
 *                 example: State Bank of India
 *               branchName:
 *                 type: string
 *                 example: Bhopal Main Branch
 *               accountNumber:
 *                 type: string
 *                 example: 123456789012
 *               ifscCode:
 *                 type: string
 *                 example: SBIN0001234
 *               accountType:
 *                 type: string
 *                 example: TRUST
 *               openingBalance:
 *                 type: number
 *                 example: 1000000
 *               currentBalance:
 *                 type: number
 *                 example: 1000000
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *               accountHolderName:
 *                 type: string
 *                 example: Patel Dharamshala Trust
 *               remarks:
 *                 type: string
 *                 example: Main operational account
 *               createdBy:
 *                 type: string
 *                 example: 6851d6f3d2ab12e0d9f8b789
 *     responses:
 *       200:
 *         description: Bank account created or updated successfully
 */
router.post(
  "/addBankAccount",
  financeController.addBankAccount
);

/* ─────────────────────────────────────
   GET BANK ACCOUNT BY ID
───────────────────────────────────── */

/**
 * @swagger
 * /admin/finance/getBankAccountById/{id}:
 *   get:
 *     summary: Get Bank Account By Id
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank account details
 */
router.get(
  "/getBankAccountById/:id",
  financeController.getBankAccountById
);

/* ─────────────────────────────────────
   GET ALL BANK ACCOUNTS
───────────────────────────────────── */

/**
 * @swagger
 * /admin/finance/getAllBankAccounts:
 *   get:
 *     summary: Get All Bank Accounts
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: isPrimary
 *         schema:
 *           type: boolean
 *
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *
 *     responses:
 *       200:
 *         description: List of bank accounts
 */
router.get(
  "/getAllBankAccounts",
  financeController.getAllBankAccounts
);

/* ─────────────────────────────────────
   BLOCK / UNBLOCK BANK ACCOUNT
───────────────────────────────────── */

/**
 * @swagger
 * /admin/finance/blockUnblockBankAccount:
 *   post:
 *     summary: Block or Unblock Bank Account
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: 6851d6f3d2ab12e0d9f8b123
 *               status:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Bank account status updated
 */
router.post(
  "/blockUnblockBankAccount",
  financeController.blockUnblockBankAccount
);



/**
 * @swagger
 * /admin/finance/addVoucher:
 *   post:
 *     summary: Create Voucher
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dharamshalaId:
 *                 type: string
 *               voucherType:
 *                 type: string
 *                 enum:
 *                   - RECEIPT
 *                   - PAYMENT
 *                   - JOURNAL
 *               category:
 *                 type: string
 *               purpose:
 *                 type: string
 *               requestedAmount:
 *                 type: number
 *               requestedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Voucher created successfully
 */
router.post(
  "/addVoucher",
  financeController.addVoucher
);


/* ─────────────────────────────────────
   GET VOUCHER BY ID
───────────────────────────────────── */

/**
 * @swagger
 * /admin/finance/getVoucherById/{id}:
 *   get:
 *     summary: Get Voucher By Id
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Voucher Id
 *         schema:
 *           type: string
 *           example: 6867f56f8e2f123456789abc
 *     responses:
 *       200:
 *         description: Voucher details fetched successfully
 */
router.get(
  "/getVoucherById/:id",
  financeController.getVoucherById
);

/* ─────────────────────────────────────
   GET ALL VOUCHERS
───────────────────────────────────── */

/**
 * @swagger
 * /admin/finance/getAllVouchers:
 *   get:
 *     summary: Get All Vouchers
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *           example: 6867f56f8e2f123456789abc
 *
 *       - in: query
 *         name: voucherType
 *         schema:
 *           type: string
 *           enum:
 *             - RECEIPT
 *             - PAYMENT
 *             - JOURNAL
 *
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum:
 *             - DONATION
 *             - ADVANCE
 *             - EXPENSE
 *             - RETURN
 *             - REIMBURSEMENT
 *             - BANK_CHARGE
 *             - BANK_INTEREST
 *             - ADJUSTMENT
 *             - OPENING_BALANCE
 *             - OTHER
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - DRAFT
 *             - PENDING
 *             - APPROVED
 *             - REJECTED
 *             - PARTIALLY_SETTLED
 *             - SETTLED
 *             - CANCELLED
 *
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *           example: donation
 *
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-01-01
 *
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-12-31
 *
 *     responses:
 *       200:
 *         description: Voucher list fetched successfully
 */
router.get(
  "/getAllVouchers",
  financeController.getAllVouchers
);


/**
 * @swagger
 * /admin/finance/updateVoucherStatus:
 *   post:
 *     summary: Update Voucher Status
 *     description: Updates voucher status. When approving PAYMENT vouchers for ADVANCE / EXPENSE / OTHER, bankAccountId is required and ledger entry will be created.
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucherId
 *               - status
 *             properties:
 *               voucherId:
 *                 type: string
 *                 example: "66b123456789012345678901"
 *               status:
 *                 type: string
 *                 enum:
 *                   - APPROVED
 *                   - REJECTED
 *                   - CANCELLED
 *                 example: "APPROVED"
 *               approvedAmount:
 *                 type: number
 *                 example: 10000
 *               statusReason:
 *                 type: string
 *                 example: "Approved by treasurer"
 *               statusUpdatedBy:
 *                 type: string
 *                 example: "66b123456789012345678902"
 *               bankAccountId:
 *                 type: string
 *                 description: Required when approving PAYMENT voucher for ADVANCE / EXPENSE / OTHER.
 *                 example: "66b123456789012345678903"
 *               referenceNumber:
 *                 type: string
 *                 description: Optional bank/reference number for ledger entry.
 *                 example: "SBI-WDL-2026-001"
 *           example:
 *             voucherId: "66b123456789012345678901"
 *             status: "APPROVED"
 *             approvedAmount: 10000
 *             statusReason: "Advance approved for secretary"
 *             statusUpdatedBy: "66b123456789012345678902"
 *             bankAccountId: "66b123456789012345678903"
 *             referenceNumber: "SBI-WDL-2026-001"
 *     responses:
 *       200:
 *         description: Voucher status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Voucher or bank account not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/updateVoucherStatus",
  financeController.updateVoucherStatus
);

/**
 * @swagger
 * /admin/finance/createLedgerEntry:
 *   post:
 *     summary: Create Ledger Entry
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucherId
 *               - bankAccountId
 *               - amount
 *               - transactionType
 *             properties:
 *               voucherId:
 *                 type: string
 *               bankAccountId:
 *                 type: string
 *               dharamshalaId:
 *                 type: string
 *               transactionDate:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *                 description: Must match the sum of all calculated item totalAmount values when items are provided.
 *               category:
 *                 type: string
 *               transactionType:
 *                 type: string
 *                 enum:
 *                   - DEBIT
 *                   - CREDIT
 *               committeeMemberId:
 *                 type: string
 *               fromAccountType:
 *                 type: string
 *               toAccountType:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *               description:
 *                 type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ledger entry created successfully
 */
router.post(
  "/createLedgerEntry",
  financeController.createLedgerEntry
);

/**
 * @swagger
 * /admin/finance/getLedgerById/{id}:
 *   get:
 *     summary: Get Ledger By Id
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ledger details fetched successfully
 */
router.get(
  "/getLedgerById/:id",
  financeController.getLedgerById
);


/**
 * @swagger
 * /admin/finance/getAllLedgerEntries:
 *   get:
 *     summary: Get All Ledger Entries
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ledger list fetched successfully
 */
router.get(
  "/getAllLedgerEntries",
  financeController.getAllLedgerEntries
);

/**
 * @swagger
 * /admin/finance/getAdvanceOutstanding:
 *   get:
 *     summary: Get Outstanding Advance Report
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: committeeMemberId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outstanding advances fetched successfully
 */
router.get(
  "/getAdvanceOutstanding",
  financeController.getAdvanceOutstanding
);


/**
 * @swagger
 * /admin/finance/getBankBalance/{bankAccountId}:
 *   get:
 *     summary: Get Current Bank Balance
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: bankAccountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank balance fetched successfully
 */
router.get(
  "/getBankBalance/:bankAccountId",
  financeController.getBankBalance
);


/**
 * @swagger
 * /admin/finance/getFinanceDashboard:
 *   get:
 *     summary: Get Finance Dashboard Summary
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Finance dashboard fetched successfully
 */
router.get(
  "/getFinanceDashboard",
  financeController.getFinanceDashboard
);

/**
 * @swagger
 * /admin/finance/getBankStatement:
 *   get:
 *     summary: Get Bank Statement
 *     tags:
 *       - Finance
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: bankAccountId
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Bank statement fetched successfully
 */
router.get(
  "/getBankStatement",
  financeController.getBankStatement
);

/**
 * @swagger
 * /admin/finance/addDirectBankExpense:
 *   post:
 *     summary: Create Direct Bank Expense
 *     description: Creates an expense directly from the bank account. Automatically creates Voucher, Ledger and deducts the bank balance.
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dharamshalaId
 *               - bankAccountId
 *               - expenseType
 *               - title
 *               - amount
 *               - createdBy
 *             properties:
 *               dharamshalaId:
 *                 type: string
 *               bankAccountId:
 *                 type: string
 *               expenseType:
 *                 type: string
 *                 enum:
 *                   - UTILITY
 *                   - LABOUR
 *                   - SALARY
 *                   - RENT
 *                   - MAINTENANCE
 *                   - PURCHASE
 *                   - CONSTRUCTION
 *                   - TRAVEL
 *                   - FOOD
 *                   - OTHER
 *               title:
 *                 type: string
 *               vendorName:
 *                 type: string
 *               vendorMobile:
 *                 type: string
 *               billNumber:
 *                 type: string
 *               billDate:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *               paymentMode:
 *                 type: string
 *                 enum:
 *                   - BANK
 *                   - UPI
 *                   - CHEQUE
 *                   - NEFT
 *               description:
 *                 type: string
 *               attachmentUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               createdBy:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemType:
 *                       type: string
 *                       enum:
 *                         - MATERIAL
 *                         - LABOUR
 *                         - TRANSPORT
 *                         - SERVICE
 *                         - OTHER
 *                     itemId:
 *                       type: string
 *                       description: Required for MATERIAL items. Select from the Dharamshala item master.
 *                     itemName:
 *                       type: string
 *                       description: Derived from itemId for MATERIAL items; required as free text for other item types.
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     unitPrice:
 *                       type: number
 *                       description: Required and must be greater than zero for MATERIAL items.
 *                     totalAmount:
 *                       type: number
 *                       readOnly: true
 *                       description: Calculated by the server as quantity multiplied by unitPrice.
 *                     remarks:
 *                       type: string
 *           example:
 *             dharamshalaId: "66b123456789012345678901"
 *             bankAccountId: "66b123456789012345678902"
 *             expenseType: "PURCHASE"
 *             title: "Kitchen Utensils Purchase"
 *             vendorName: "Shree Steel House"
 *             vendorMobile: "9876543210"
 *             billNumber: "INV-001"
 *             billDate: "2026-06-25"
 *             amount: 25000
 *             paymentMode: "BANK"
 *             description: "Purchased utensils for kitchen"
 *             createdBy: "66b123456789012345678903"
 *             items:
 *               - itemType: "MATERIAL"
 *                 itemId: "66b123456789012345678904"
 *                 quantity: 100
 *                 unit: "Piece"
 *                 unitPrice: 250
 *     responses:
 *       200:
 *         description: Direct bank expense created successfully
 */
router.post(
  "/addDirectBankExpense",
  financeController.addDirectBankExpense
);


/**
 * @swagger
 * /admin/finance/addExpenseAgainstAdvance:
 *   post:
 *     summary: Create Expense Against Advance
 *     description: Creates an expense against an existing advance voucher. No bank deduction or ledger will be created because the money has already been withdrawn.
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dharamshalaId
 *               - voucherId
 *               - expenseType
 *               - title
 *               - amount
 *               - createdBy
 *             properties:
 *               dharamshalaId:
 *                 type: string
 *               voucherId:
 *                 type: string
 *               expenseType:
 *                 type: string
 *                 enum:
 *                   - UTILITY
 *                   - LABOUR
 *                   - SALARY
 *                   - RENT
 *                   - MAINTENANCE
 *                   - PURCHASE
 *                   - CONSTRUCTION
 *                   - TRAVEL
 *                   - FOOD
 *                   - OTHER
 *               title:
 *                 type: string
 *               vendorName:
 *                 type: string
 *               vendorMobile:
 *                 type: string
 *               billNumber:
 *                 type: string
 *               billDate:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *                 description: Must match the sum of all calculated item totalAmount values when items are provided.
 *               paymentMode:
 *                 type: string
 *                 enum:
 *                   - ADVANCE
 *               description:
 *                 type: string
 *               attachmentUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               createdBy:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemType:
 *                       type: string
 *                       enum:
 *                         - MATERIAL
 *                         - LABOUR
 *                         - TRANSPORT
 *                         - SERVICE
 *                         - OTHER
 *                     itemId:
 *                       type: string
 *                       description: Required for MATERIAL items. Select from the Dharamshala item master.
 *                     itemName:
 *                       type: string
 *                       description: Derived from itemId for MATERIAL items; required as free text for other item types.
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     unitPrice:
 *                       type: number
 *                       description: Required and must be greater than zero for MATERIAL items.
 *                     totalAmount:
 *                       type: number
 *                       readOnly: true
 *                       description: Calculated by the server as quantity multiplied by unitPrice.
 *                     remarks:
 *                       type: string
 *           example:
 *             dharamshalaId: "66b123456789012345678901"
 *             voucherId: "66b123456789012345678902"
 *             expenseType: "PURCHASE"
 *             title: "Fan Purchase"
 *             vendorName: "Patel Electricals"
 *             vendorMobile: "9876543210"
 *             billNumber: "PE-101"
 *             billDate: "2026-06-25"
 *             amount: 8500
 *             paymentMode: "ADVANCE"
 *             description: "Purchased 10 ceiling fans"
 *             createdBy: "66b123456789012345678903"
 *             items:
 *               - itemType: "MATERIAL"
 *                 itemId: "66b123456789012345678904"
 *                 quantity: 10
 *                 unit: "Piece"
 *                 unitPrice: 850
 *     responses:
 *       200:
 *         description: Expense settled against advance successfully
 */
router.post(
  "/addExpenseAgainstAdvance",
  financeController.addExpenseAgainstAdvance
);

/**
 * @swagger
 * /admin/finance/getExpenseById/{id}:
 *   get:
 *     summary: Get Expense By Id
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense fetched successfully
 */
router.get(
  "/getExpenseById/:id",
  financeController.getExpenseById
);

/**
 * @swagger
 * /admin/finance/getAllExpenses:
 *   get:
 *     summary: Get All Expenses
 *     description: Returns paginated expenses for a Dharamshala with optional filters.
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page index
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dharamshala Id
 *
 *       - in: query
 *         name: expenseType
 *         schema:
 *           type: string
 *           enum:
 *             - UTILITY
 *             - LABOUR
 *             - SALARY
 *             - RENT
 *             - MAINTENANCE
 *             - PURCHASE
 *             - CONSTRUCTION
 *             - TRAVEL
 *             - FOOD
 *             - OTHER
 *
 *       - in: query
 *         name: expenseSource
 *         schema:
 *           type: string
 *           enum:
 *             - DIRECT_BANK
 *             - AGAINST_ADVANCE
 *         description: Expense source
 *
 *       - in: query
 *         name: paymentMode
 *         schema:
 *           type: string
 *           enum:
 *             - CASH
 *             - BANK
 *             - UPI
 *             - CHEQUE
 *             - NEFT
 *             - ADVANCE
 *         description: Payment mode
 *
 *       - in: query
 *         name: voucherId
 *         schema:
 *           type: string
 *         description: Voucher Id
 *
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Search by expense number, title, vendor name, vendor mobile or bill number
 *
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Bill date from
 *
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Bill date to
 *
 *     responses:
 *       200:
 *         description: Expenses fetched successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getAllExpenses",
  financeController.getAllExpenses
);
/**
 * @swagger
 * /admin/finance/getCommitteeMemberAdvanceSummary:
 *   get:
 *     summary: Committee Member Advance Summary
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Committee member advance summary fetched successfully
 */
router.get(
  "/getCommitteeMemberAdvanceSummary",
  financeController.getCommitteeMemberAdvanceSummary
);

/**
 * @swagger
 * /admin/finance/getCommitteeMemberAdvanceDetails:
 *   get:
 *     summary: Committee Member Advance Details
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: committeeMemberId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: number
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: number
 *
 *     responses:
 *       200:
 *         description: Committee member advance details fetched successfully
 */
router.get(
  "/getCommitteeMemberAdvanceDetails",
  financeController.getCommitteeMemberAdvanceDetails
);


/**
 * @swagger
 * /admin/finance/getExpenseReport:
 *   get:
 *     summary: Expense Report
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: expenseType
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: vendorName
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Expense report fetched successfully
 */
router.get(
  "/getExpenseReport",
  financeController.getExpenseReport
);


/**
 * @swagger
 * /admin/finance/getCashBookReport:
 *   get:
 *     summary: Cash Book Report
 *     tags: [Finance]
 *
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: bankAccountId
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Cash book report fetched successfully
 */
router.get(
  "/getCashBookReport",
  financeController.getCashBookReport
);


/**
 * @swagger
 * /admin/finance/getDonationReport:
 *   get:
 *     summary: Donation Report
 *     tags:
 *       - Finance
 *
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: bankAccountId
 *         required: false
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *
 *       - in: query
 *         name: pageIndex
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *
 *     responses:
 *       200:
 *         description: Donation report fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 responseCode:
 *                   type: integer
 *                   example: 200
 *
 *                 message:
 *                   type: string
 *                   example: Donation report fetched successfully
 *
 *                 responseBody:
 *                   type: object
 *                   properties:
 *                     totalDonation:
 *                       type: number
 *                       example: 500000
 *
 *                     totalCount:
 *                       type: integer
 *                       example: 10
 *
 *                     pageIndex:
 *                       type: integer
 *                       example: 0
 *
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *
 *                     records:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *
 *                           ledgerNumber:
 *                             type: string
 *                             example: LED000001
 *
 *                           voucherNumber:
 *                             type: string
 *                             example: VCH-2026-00001
 *
 *                           transactionDate:
 *                             type: string
 *                             format: date-time
 *
 *                           amount:
 *                             type: number
 *                             example: 50000
 *
 *                           description:
 *                             type: string
 *                             example: Donation from Patel Family
 *
 *                           referenceNumber:
 *                             type: string
 *                             example: UPI123456
 *
 *                           bankAccount:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *
 *                               accountName:
 *                                 type: string
 *                                 example: Main SBI Account
 *
 *                               bankName:
 *                                 type: string
 *                                 example: State Bank of India
 *
 *                               accountNumber:
 *                                 type: string
 *                                 example: 123456789012
 */
router.get(
  "/getDonationReport",
  financeController.getDonationReport
);
module.exports =
  router;
