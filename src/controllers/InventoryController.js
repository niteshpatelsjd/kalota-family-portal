const inventoryService = require("../services/InventoryService");


exports.addAssetTransactionController =
  async (req, res) => {
    const result =
      await inventoryService.addAssetTransaction(req.body);

    return res.status(200).json(result);
  };

exports.getAssetTransactionsController =
  async (req, res) => {
    const result =
      await inventoryService.getAssetTransactions(req.query);

    return res.status(result.responseCode).json(result);
  };

exports.addStockTransactionController = async (req, res) => {
  const result =
    await inventoryService.addStockTransaction(req.body);

  return res.status(result.responseCode).json(result);
};

exports.getStockTransactionsController = async (req, res) => {
  const result =
    await inventoryService.getStockTransactions(req.query);

  return res.status(result.responseCode).json(result);
};

exports.getStockTransactionByIdController = async (req, res) => {
  const result =
    await inventoryService.getStockTransactionById(req.params.id);

  return res.status(result.responseCode).json(result);
};
exports.addOrUpdateInventoryItem =
  async (req, res) => {
    const result =
      await inventoryService.addOrUpdateInventoryItem(
        req.body
      );

    return res
      .status(result.responseCode)
      .json(result);
  };

exports.getAllInventoryItems =
  async (req, res) => {
    const result =
      await inventoryService.getAllInventoryItems(
        req.query
      );

    return res
      .status(result.responseCode)
      .json(result);
  };

exports.getInventoryItemById =
  async (req, res) => {
    const result =
      await inventoryService.getInventoryItemById(
        req.params.id
      );

    return res
      .status(result.responseCode)
      .json(result);
  };

exports.blockUnblockInventoryItem =
  async (req, res) => {
    const result =
      await inventoryService.blockUnblockInventoryItem(
        req.body
      );

    return res
      .status(result.responseCode)
      .json(result);
  };

exports.addOrUpdateAssetController = async (req, res) => {
  const result =
    await inventoryService.addOrUpdateAsset(
      req.body,
      req.files
    );

  return res
    .status(result.responseCode)
    .json(result);
};
exports.addAssetController = async (req, res) => {
  const result = await inventoryService.addAsset(req.body);
  return res.status(result.responseCode).json(result);
};

exports.getAllAssetsController = async (req, res) => {
  const result = await inventoryService.getAllAssets(req.query);
  return res.status(result.responseCode).json(result);
};

exports.getAssetByIdController = async (req, res) => {
  const result = await inventoryService.getAssetById(req.params.id);
  return res.status(result.responseCode).json(result);
};

exports.updateAssetController = async (req, res) => {
  const result = await inventoryService.updateAsset(req.params.id, req.body);
  return res.status(result.responseCode).json(result);
};

exports.blockUnblockAssetController = async (req, res) => {
  const result = await inventoryService.blockUnblockAsset(req.body);
  return res.status(result.responseCode).json(result);
};


exports.addUpdateItemController = async (req, res) => {
  const result = await inventoryService.addUpdateItem(req.body);
  return res.status(result.responseCode).json(result);
};

exports.getAllItemsController = async (req, res) => {
  const result = await inventoryService.getAllItems(req.query);
  return res.status(result.responseCode).json(result);
};

exports.blockUnblockItemController = async (req, res) => {
  const result = await inventoryService.blockUnblockItem(req.body);
  return res.status(result.responseCode).json(result);
};