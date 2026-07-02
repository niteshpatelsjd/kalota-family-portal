/**
 * @openapi
 * tags:
 *   - name: Inventory Controller
 *     description: Dharamshala asset and inventory management APIs
 */

const express = require("express");
const router = express.Router();

const inventoryController = require("../controllers/InventoryController");
const multer = require("multer");
// Multer setup (memory storage so we can pass buffer to fileUtil)

const storage =
  multer.diskStorage({
    destination:
      "./uploads",

    filename: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        Date.now() +
          "-" +
          file.originalname
      );
    },
  });
const upload = multer({ storage });


/**
 * @openapi
 * /admin/inventory/addOrUpdateAsset:
 *   post:
 *     tags: [Inventory Controller]
 *     summary: Add or Update Dharamshala Asset
 *     description: >
 *       Creates a new asset when **id** is not provided.
 *       Updates an existing asset when **id** is provided.
 *
 *       Supports uploading multiple asset images using **mediaFiles**.
 *
 *       Asset examples:
 *       - Land
 *       - Building
 *       - Kitchen Items
 *       - Chairs
 *       - Tables
 *       - Fans
 *       - Lights
 *       - Water Supply
 *       - Construction Material
 *       - Food Serve Items
 *       - Beds
 *       - Other Assets
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *
 *               id:
 *                 type: string
 *                 description: Asset Id (Required only while updating)
 *                 example: "6a3df44fa9d22767ee7ff9f9"
 *
 *               dharamshalaId:
 *                 type: string
 *                 description: Dharamshala Id (Required while creating)
 *                 example: "6a299762c760d49fa2a5af44"
 *
 *               assetName:
 *                 type: string
 *                 example: "Plastic Chair"
 *
 *               assetCategory:
 *                 type: string
 *                 enum:
 *                   - LAND
 *                   - BUILDING
 *                   - ROOM
 *                   - KITCHEN
 *                   - ELECTRICAL
 *                   - FURNITURE
 *                   - BEDDING
 *                   - WATER_SYSTEM
 *                   - CONSTRUCTION_MATERIAL
 *                   - FOOD_SERVE_ITEM
 *                   - VEHICLE
 *                   - CCTV
 *                   - SOUND_SYSTEM
 *                   - IT_EQUIPMENT
 *                   - OTHER
 *
 *               sourceType:
 *                 type: string
 *                 enum:
 *                   - DONATION
 *                   - PURCHASE
 *                   - TRANSFER
 *                   - SELF_CONSTRUCTED
 *                   - OTHER
 *
 *               donorName:
 *                 type: string
 *                 example: "Dilip Patel"
 *
 *               donorMobile:
 *                 type: string
 *                 example: "9876543210"
 *
 *               supplierName:
 *                 type: string
 *                 example: "Krishna Hardware"
 *
 *               quantity:
 *                 type: number
 *                 example: 100
 *
 *               unit:
 *                 type: string
 *                 example: "Piece"
 *
 *               purchaseCost:
 *                 type: number
 *                 example: 50000
 *
 *               currentValue:
 *                 type: number
 *                 example: 45000
 *
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-26"
 *
 *               donationDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-26"
 *
 *               condition:
 *                 type: string
 *                 enum:
 *                   - NEW
 *                   - GOOD
 *                   - AVERAGE
 *                   - DAMAGED
 *                   - REPAIR_REQUIRED
 *                   - SCRAP
 *                 example: "GOOD"
 *
 *               location:
 *                 type: string
 *                 example: "Main Hall"
 *
 *               expenseId:
 *                 type: string
 *                 example: "6a3d297f7b5b11a5f7b46be3"
 *
 *               donationId:
 *                 type: string
 *                 example: "6a3df44fa9d22767ee7ff9f9"
 *
 *               remarks:
 *                 type: string
 *                 example: "Donated by Patel Family"
 *
 *               createdBy:
 *                 type: string
 *                 description: Required while creating
 *                 example: "6a26b0a18e0c9b233c4e6e4d"
 *
 *               updatedBy:
 *                 type: string
 *                 description: Required while updating
 *                 example: "6a26b0a18e0c9b233c4e6e4d"
 *
 *               existingMediaUrls:
 *                 type: string
 *                 description: >
 *                   JSON Array of already uploaded images.
 *                   Send while updating.
 *                 example: '["https://abc.com/asset1.jpg","https://abc.com/asset2.jpg"]'
 *
 *               mediaFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *
 *     responses:
 *       200:
 *         description: Asset created/updated successfully
 *
 *       400:
 *         description: Validation error
 *
 *       404:
 *         description: Asset not found
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/addOrUpdateAsset",
  upload.fields([
    {
      name: "mediaFiles",
      maxCount: 10,
    },
  ]),
  inventoryController.addOrUpdateAssetController
);



/**
 * @openapi
 * /admin/inventory/getAllAssets:
 *   get:
 *     tags: [Inventory Controller]
 *     summary: Get all Dharamshala Assets
 *     description: Fetch paginated Dharamshala assets with filters and search.
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page index starting from 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *         description: Filter by Dharamshala ID
 *       - in: query
 *         name: assetCategory
 *         schema:
 *           type: string
 *           enum:
 *             - LAND
 *             - BUILDING
 *             - ROOM
 *             - KITCHEN
 *             - ELECTRICAL
 *             - FURNITURE
 *             - BEDDING
 *             - WATER_SYSTEM
 *             - CONSTRUCTION_MATERIAL
 *             - FOOD_SERVE_ITEM
 *             - VEHICLE
 *             - CCTV
 *             - SOUND_SYSTEM
 *             - IT_EQUIPMENT
 *             - OTHER
 *         description: Filter by asset category
 *       - in: query
 *         name: sourceType
 *         schema:
 *           type: string
 *           enum:
 *             - DONATION
 *             - PURCHASE
 *             - TRANSFER
 *             - SELF_CONSTRUCTED
 *             - OTHER
 *         description: Filter by asset source type
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *           enum:
 *             - NEW
 *             - GOOD
 *             - AVERAGE
 *             - DAMAGED
 *             - REPAIR_REQUIRED
 *             - SCRAP
 *         description: Filter by asset condition
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by asset location
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Search asset number, name, donor, supplier or location
 *       - in: query
 *         name: statusFlag
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Asset status flag. 1 active, 0 inactive
 *     responses:
 *       200:
 *         description: Assets fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getAllAssets",
  inventoryController.getAllAssetsController
);

/**
 * @openapi
 * /admin/inventory/getAssetById/{id}:
 *   get:
 *     tags: [Inventory Controller]
 *     summary: Get Dharamshala Asset by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Asset ID
 *         schema:
 *           type: string
 *           example: "6a3df44fa9d22767ee7ff9f9"
 *     responses:
 *       200:
 *         description: Asset fetched successfully
 *       400:
 *         description: Asset id is required
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getAssetById/:id",
  inventoryController.getAssetByIdController
);

/**
 * @openapi
 * /admin/inventory/blockUnblockAsset:
 *   post:
 *     tags: [Inventory Controller]
 *     summary: Activate or deactivate Dharamshala Asset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - statusFlag
 *             properties:
 *               id:
 *                 type: string
 *                 example: "6a3df44fa9d22767ee7ff9f9"
 *               statusFlag:
 *                 type: integer
 *                 example: 1
 *                 description: 1 active, 0 inactive
 *               updatedBy:
 *                 type: string
 *                 example: "6a26b0a18e0c9b233c4e6e4d"
 *     responses:
 *       200:
 *         description: Asset status updated successfully
 *       400:
 *         description: Asset id is required
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/blockUnblockAsset",
  inventoryController.blockUnblockAssetController
);


/**
 * @openapi
 * /admin/inventory/addOrUpdateInventoryItem:
 *   post:
 *     tags: [Inventory Controller]
 *     summary: Add or Update Inventory Item
 *     description: >
 *       Creates a new inventory item when **id** is not provided.
 *       Updates an existing inventory item when **id** is provided.
 *       Inventory items are consumable or stock-based items such as cement,
 *       rice, oil, bulbs, cleaning material, kitchen stock, construction
 *       material, etc.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemName
 *               - category
 *             properties:
 *               id:
 *                 type: string
 *                 description: Inventory item id. Required only while updating.
 *                 example: "6a3df44fa9d22767ee7ff9f9"
 *               dharamshalaId:
 *                 type: string
 *                 description: Required while creating.
 *                 example: "6a299762c760d49fa2a5af44"
 *               itemId:
 *                 type: string
 *                 description: Active global item-master id. Required while creating.
 *               itemName:
 *                 type: string
 *                 example: "Cement"
 *               category:
 *                 type: string
 *                 enum:
 *                   - FOOD
 *                   - GROCERY
 *                   - KITCHEN
 *                   - CLEANING
 *                   - CONSTRUCTION
 *                   - ELECTRICAL
 *                   - PLUMBING
 *                   - GARDEN
 *                   - STATIONERY
 *                   - OTHER
 *                 example: "CONSTRUCTION"
 *               unit:
 *                 type: string
 *                 example: "Bag"
 *               currentStock:
 *                 type: number
 *                 readOnly: true
 *                 description: Updated only through stock transactions.
 *                 example: 0
 *               minimumStock:
 *                 type: number
 *                 description: Initial threshold. Use updateMinimumStock for later changes.
 *                 example: 20
 *               location:
 *                 type: string
 *                 example: "Store Room"
 *               remarks:
 *                 type: string
 *                 example: "Initial stock added"
 *               createdBy:
 *                 type: string
 *                 description: Required while creating.
 *                 example: "6a26b0a18e0c9b233c4e6e4d"
 *               updatedBy:
 *                 type: string
 *                 description: Required while updating.
 *                 example: "6a26b0a18e0c9b233c4e6e4d"
 *     responses:
 *       200:
 *         description: Inventory item added/updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/addOrUpdateInventoryItem",
  inventoryController.addOrUpdateInventoryItem
);

/**
 * @openapi
 * /admin/inventory/getAllInventoryItems:
 *   get:
 *     tags: [Inventory Controller]
 *     summary: Get all Inventory Items
 *     description: Fetch paginated inventory items with filters like category, low stock, out of stock and search.
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page index starting from 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *         description: Filter by Dharamshala ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum:
 *             - FOOD
 *             - GROCERY
 *             - KITCHEN
 *             - CLEANING
 *             - CONSTRUCTION
 *             - ELECTRICAL
 *             - PLUMBING
 *             - GARDEN
 *             - STATIONERY
 *             - OTHER
 *         description: Filter by item category
 *       - in: query
 *         name: lowStockOnly
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Show only items where current stock is less than or equal to minimum stock
 *       - in: query
 *         name: outOfStockOnly
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Show only items where current stock is zero or below
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *           example: "cement"
 *         description: Search by item code, item name, category or location
 *       - in: query
 *         name: statusFlag
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Inventory status flag. 1 active, 0 inactive
 *     responses:
 *       200:
 *         description: Inventory items fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               responseCode: 200
 *               message: Inventory items fetched successfully
 *               responseBody:
 *                 content:
 *                   - _id: "INVENTORY_ITEM_ID"
 *                     itemId: "MASTER_ITEM_ID"
 *                     itemCode: "ITEM-001"
 *                     itemName: "Cement"
 *                     category: "CONSTRUCTION_MATERIAL"
 *                     unit: "Bag"
 *                     currentStock: 25
 *                     minimumStock: 5
 *                     stockStatus: "IN_STOCK"
 *                     averageUnitPrice: 420
 *                     totalStockValue: 10500
 *                     lastPurchaseUnitPrice: 430
 *                     updatedAt: "2026-07-02T10:00:00.000Z"
 *                 pageIndex: 0
 *                 pageSize: 10
 *                 totalElements: 1
 *                 totalPages: 1
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getAllInventoryItems",
  inventoryController.getAllInventoryItems
);

/**
 * @openapi
 * /admin/inventory/getInventoryItemById/{id}:
 *   get:
 *     tags: [Inventory Controller]
 *     summary: Get Inventory Item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Inventory Item ID
 *         schema:
 *           type: string
 *           example: "6a3df44fa9d22767ee7ff9f9"
 *     responses:
 *       200:
 *         description: Inventory item fetched successfully
 *       400:
 *         description: Inventory item id is required
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getInventoryItemById/:id",
  inventoryController.getInventoryItemById
);

/**
 * @openapi
 * /admin/inventory/blockUnblockInventoryItem:
 *   post:
 *     tags: [Inventory Controller]
 *     summary: Activate or Deactivate Inventory Item
 *     description: Change inventory item status flag. Use statusFlag 1 for active and 0 for inactive.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - statusFlag
 *             properties:
 *               id:
 *                 type: string
 *                 example: "6a3df44fa9d22767ee7ff9f9"
 *               statusFlag:
 *                 type: integer
 *                 example: 1
 *                 description: 1 active, 0 inactive
 *               updatedBy:
 *                 type: string
 *                 example: "6a26b0a18e0c9b233c4e6e4d"
 *     responses:
 *       200:
 *         description: Inventory item status updated successfully
 *       400:
 *         description: Inventory item id is required
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/blockUnblockInventoryItem",
  inventoryController.blockUnblockInventoryItem
);

/**
 * @openapi
 * /admin/inventory/updateMinimumStock:
 *   patch:
 *     tags: [Inventory Controller]
 *     summary: Update minimum stock
 *     description: Updates the Dharamshala-specific low-stock threshold without changing current stock.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inventoryItemId
 *               - minimumStock
 *             properties:
 *               inventoryItemId:
 *                 type: string
 *               minimumStock:
 *                 type: number
 *                 minimum: 0
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Minimum stock updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Inventory item not found
 */
router.patch(
  "/updateMinimumStock",
  inventoryController.updateMinimumStock
);


/**
 * @openapi
 * /admin/inventory/addStockTransaction:
 *   post:
 *     tags: [Inventory Controller]
 *     summary: Add Stock Transaction
 *     description: >
 *       Adds a stock transaction for an inventory item and automatically updates
 *       current stock.
 *
 *       Increase stock types:
 *       OPENING, PURCHASE, DONATION, RETURN, ADJUSTMENT_IN
 *
 *       Decrease stock types:
 *       CONSUMPTION, DAMAGE, LOST, TRANSFER, ADJUSTMENT_OUT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dharamshalaId
 *               - inventoryItemId
 *               - transactionType
 *               - quantity
 *             properties:
 *               dharamshalaId:
 *                 type: string
 *                 example: "6a299762c760d49fa2a5af44"
 *               inventoryItemId:
 *                 type: string
 *                 example: "6a3df44fa9d22767ee7ff9f9"
 *               transactionType:
 *                 type: string
 *                 enum:
 *                   - OPENING
 *                   - PURCHASE
 *                   - DONATION
 *                   - CONSUMPTION
 *                   - DAMAGE
 *                   - LOST
 *                   - RETURN
 *                   - TRANSFER
 *                   - ADJUSTMENT_IN
 *                   - ADJUSTMENT_OUT
 *                 example: "PURCHASE"
 *               quantity:
 *                 type: number
 *                 example: 50
 *               unit:
 *                 type: string
 *                 example: "Bag"
 *               unitPrice:
 *                 type: number
 *                 description: Required for PURCHASE transactions.
 *                 example: 400
 *               totalAmount:
 *                 type: number
 *                 readOnly: true
 *                 description: Calculated by the server for PURCHASE transactions.
 *                 example: 20000
 *               sourceType:
 *                 type: string
 *                 enum:
 *                   - DONATION
 *                   - PURCHASE
 *                   - MANUAL
 *                   - EXPENSE
 *                   - OTHER
 *                 example: "MANUAL"
 *               expenseId:
 *                 type: string
 *                 example: "6a3d297f7b5b11a5f7b46be3"
 *               donationId:
 *                 type: string
 *                 example: "6a3df44fa9d22767ee7ff9f9"
 *               referenceNumber:
 *                 type: string
 *                 example: "BILL-101"
 *               remarks:
 *                 type: string
 *                 example: "Purchased cement bags"
 *               createdBy:
 *                 type: string
 *                 example: "6a26b0a18e0c9b233c4e6e4d"
 *     responses:
 *       200:
 *         description: Stock transaction added successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/addStockTransaction",
  inventoryController.addStockTransactionController
);

/**
 * @openapi
 * /admin/inventory/decreaseStock:
 *   post:
 *     tags: [Inventory Controller]
 *     summary: Decrease inventory stock
 *     description: Creates an ADJUSTMENT_OUT transaction and decreases current stock after validating availability.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inventoryItemId
 *               - quantity
 *             properties:
 *               inventoryItemId:
 *                 type: string
 *                 description: Dharamshala inventory item id.
 *               quantity:
 *                 type: number
 *                 minimum: 0.000001
 *               remarks:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *               updatedBy:
 *                 type: string
 *           example:
 *             inventoryItemId: "INVENTORY_ITEM_ID"
 *             quantity: 5
 *             remarks: "Manual stock correction"
 *             updatedBy: "ADMIN_USER_ID"
 *     responses:
 *       200:
 *         description: Stock decreased successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       404:
 *         description: Active inventory item not found
 */
router.post(
  "/decreaseStock",
  inventoryController.decreaseStockController
);

/**
 * @openapi
 * /admin/inventory/getStockTransactions:
 *   get:
 *     tags: [Inventory Controller]
 *     summary: Get Stock Transactions
 *     description: Fetch paginated stock transaction ledger with filters.
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *         description: Filter by Dharamshala ID
 *       - in: query
 *         name: inventoryItemId
 *         schema:
 *           type: string
 *         description: Filter by Inventory Item ID
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum:
 *             - OPENING
 *             - PURCHASE
 *             - DONATION
 *             - CONSUMPTION
 *             - DAMAGE
 *             - LOST
 *             - RETURN
 *             - TRANSFER
 *             - ADJUSTMENT_IN
 *             - ADJUSTMENT_OUT
 *         description: Filter by stock transaction type
 *       - in: query
 *         name: sourceType
 *         schema:
 *           type: string
 *           enum:
 *             - DONATION
 *             - PURCHASE
 *             - MANUAL
 *             - EXPENSE
 *             - OTHER
 *         description: Filter by source type
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *           example: "cement"
 *         description: Search transaction number, reference number or remarks
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-06-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-06-30"
 *       - in: query
 *         name: statusFlag
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Stock transactions fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getStockTransactions",
  inventoryController.getStockTransactionsController
);

/**
 * @openapi
 * /admin/inventory/getStockTransactionById/{id}:
 *   get:
 *     tags: [Inventory Controller]
 *     summary: Get Stock Transaction by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Stock Transaction ID
 *         schema:
 *           type: string
 *           example: "6a3df44fa9d22767ee7ff9f9"
 *     responses:
 *       200:
 *         description: Stock transaction fetched successfully
 *       400:
 *         description: Stock transaction id is required
 *       404:
 *         description: Stock transaction not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/getStockTransactionById/:id",
  inventoryController.getStockTransactionByIdController
);


/**
 * @swagger
 * /admin/inventory/addAssetTransaction:
 *   post:
 *     summary: Add Asset Transaction
 *     tags: [Inventory Controller]
 *     description: |
 *       Add a new transaction against an existing asset.
 *
 *       Transaction Types:
 *       - OPENING
 *       - DONATION
 *       - PURCHASE
 *       - TRANSFER_IN
 *       - TRANSFER_OUT
 *       - DAMAGED
 *       - LOST
 *       - REPAIRED
 *       - DISPOSED
 *       - ADJUSTMENT_IN
 *       - ADJUSTMENT_OUT
 *
 *       This API automatically updates the Asset Master quantity.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dharamshalaId
 *               - assetId
 *               - transactionType
 *               - quantity
 *               - createdBy
 *             properties:
 *               dharamshalaId:
 *                 type: string
 *                 example: "6a299762c760d49fa2a5af44"
 *
 *               assetId:
 *                 type: string
 *                 example: "6a4b132b98dc4bb4cf8a1121"
 *
 *               transactionType:
 *                 type: string
 *                 enum:
 *                   - OPENING
 *                   - DONATION
 *                   - PURCHASE
 *                   - TRANSFER_IN
 *                   - TRANSFER_OUT
 *                   - DAMAGED
 *                   - LOST
 *                   - REPAIRED
 *                   - DISPOSED
 *                   - ADJUSTMENT_IN
 *                   - ADJUSTMENT_OUT
 *                 example: DONATION
 *
 *               quantity:
 *                 type: number
 *                 example: 20
 *
 *               unit:
 *                 type: string
 *                 example: Piece
 *
 *               unitPrice:
 *                 type: number
 *                 example: 2500
 *
 *               totalAmount:
 *                 type: number
 *                 description: Calculated as quantity multiplied by unitPrice when omitted.
 *                 example: 50000
 *
 *               donorName:
 *                 type: string
 *                 example: Dilip Patel
 *
 *               donorMobile:
 *                 type: string
 *                 example: "9876543210"
 *
 *               supplierName:
 *                 type: string
 *                 example: Krishna Traders
 *
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *
 *               expenseId:
 *                 type: string
 *                 nullable: true
 *
 *               donationId:
 *                 type: string
 *                 nullable: true
 *
 *               referenceNumber:
 *                 type: string
 *                 example: INV-101
 *
 *               remarks:
 *                 type: string
 *                 example: 20 ceiling fans donated
 *
 *               createdBy:
 *                 type: string
 *                 example: "6a33de68bc98a5d2ce54e652"
 *
 *     responses:
 *       200:
 *         description: Asset transaction added successfully.
 */
router.post(
  "/addAssetTransaction",
  inventoryController.addAssetTransactionController
);


/**
 * @swagger
 * /admin/inventory/getAssetTransactions:
 *   get:
 *     summary: Get Asset Transactions
 *     tags: [Inventory Controller]
 *     description: Get paginated list of asset transactions with filters.
 *
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
 *         name: assetId
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum:
 *             - OPENING
 *             - DONATION
 *             - PURCHASE
 *             - TRANSFER_IN
 *             - TRANSFER_OUT
 *             - DAMAGED
 *             - LOST
 *             - REPAIRED
 *             - DISPOSED
 *             - ADJUSTMENT_IN
 *             - ADJUSTMENT_OUT
 *
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: statusFlag
 *         schema:
 *           type: integer
 *           default: 1
 *
 *     responses:
 *       200:
 *         description: Asset transactions fetched successfully.
 */
router.get(
  "/getAssetTransactions",
  inventoryController.getAssetTransactionsController
);



/**
 * @swagger
 * /admin/inventory/addUpdateItem:
 *   post:
 *     summary: Add or update global item master
 *     tags: [Inventory Controller]
 *     description: Create or update an Asset or Inventory item available to every Dharamshala.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemName
 *               - itemNature
 *             properties:
 *               id:
 *                 type: string
 *               itemName:
 *                 type: string
 *                 example: "Fan"
 *               itemNature:
 *                 type: string
 *                 enum: [ASSET, INVENTORY]
 *                 example: "ASSET"
 *               category:
 *                 type: string
 *                 example: "ELECTRICAL"
 *               defaultUnit:
 *                 type: string
 *                 example: "Piece"
 *               description:
 *                 type: string
 *                 example: "Ceiling fan used in rooms"
 *               createdBy:
 *                 type: string
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added or updated successfully.
 */
router.post(
  "/addUpdateItem",
  inventoryController.addUpdateItemController
);

// Backward-compatible descriptive alias.
router.post(
  "/addOrUpdateItem",
  inventoryController.addUpdateItemController
);

/**
 * @swagger
 * /admin/inventory/getAllItem:
 *   get:
 *     summary: Get global item master list
 *     tags: [Inventory Controller]
 *     parameters:
 *       - in: query
 *         name: itemNature
 *         schema:
 *           type: string
 *           enum: [ASSET, INVENTORY]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *       - in: query
 *         name: statusFlag
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *           default: 1
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Items fetched successfully.
 */
router.get(
  "/getAllItem",
  inventoryController.getAllItemsController
);

// Keep the plural route available for existing clients.
router.get(
  "/getAllItems",
  inventoryController.getAllItemsController
);

/**
 * @swagger
 * /admin/inventory/blockUnblockItem:
 *   post:
 *     summary: Block or activate a Dharamshala item
 *     tags: [Inventory Controller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, statusFlag]
 *             properties:
 *               id:
 *                 type: string
 *               statusFlag:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: 1 activates the item and 2 blocks it.
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item status updated successfully.
 */
router.post(
  "/blockUnblockItem",
  inventoryController.blockUnblockItemController
);

module.exports = router;
