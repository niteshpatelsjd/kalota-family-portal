const dharamshalaService =
  require(
    "../services/DharamshalaService"
  );

const buildResponse =
  require("../utils/response");

const logger =
  require("../utils/logger");

/* ─────────────────────────────────────
   CREATE / UPDATE
───────────────────────────────────── */

exports.addDharamshala =
  async (req, res) => {
    try {
      const result =
        await dharamshalaService.addDharamshala(
          {
            ...req.body,

            profileImageFile:
              req.files
                ?.profileImageFile?.[0] ||
              null,

            bannerImageFile:
              req.files
                ?.bannerImageFile?.[0] ||
              null,
          }
        );

      res.status(200).json(result);
    } catch (err) {
      logger.error(
        "addDharamshala controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      res.status(200).json(
        buildResponse(
          500,
          err.message,
          null
        )
      );
    }
  };

/* ─────────────────────────────────────
   GET BY ID
───────────────────────────────────── */

exports.getDharamshalaById =
  async (req, res) => {
    try {
      const { id } = req.params;

      const result =
        await dharamshalaService.getDharamshalaById(
          id
        );

      res.status(200).json(result);
    } catch (err) {
      logger.error(
        "getDharamshalaById controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      res.status(200).json(
        buildResponse(
          500,
          err.message,
          null
        )
      );
    }
  };


  exports.getNearbyLocations = async (req, res) => {
  try {
    const result =
      await dharamshalaService.getNearbyLocations(
        req.query
      );

    return res.status(200).json(result);
  } catch (err) {
    logger.error("getNearbyLocations controller error", {
      error: err.message,
      stack: err.stack,
    });

    return res.status(200).json(
      buildResponse(500, err.message, null)
    );
  }
};
/* ─────────────────────────────────────
   GET ALL
───────────────────────────────────── */

exports.getAllDharamshala =
  async (req, res) => {
    try {
      let {
        pageIndex = 0,
        pageSize = 10,
        status,
        searchText,
        villageId,
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

      villageId =
        typeof villageId ===
        "string"
          ? villageId.trim()
          : "";

      logger.info(
        "getAllDharamshala request",
        {
          pageIndex,
          pageSize,
          status,
          searchText,
          villageId,
        }
      );

      const result =
        await dharamshalaService.getAllDharamshala(
          {
            pageIndex,
            pageSize,
            status,
            searchText,
            villageId,
          }
        );

      res.status(200).json(result);
    } catch (err) {
      logger.error(
        "getAllDharamshala controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      res.status(200).json(
        buildResponse(
          500,
          err.message,
          null
        )
      );
    }
  };

/* ─────────────────────────────────────
   BLOCK / UNBLOCK
───────────────────────────────────── */

exports.blockUnblockDharamshala =
  async (req, res) => {
    try {
      const { id, status } =
        req.body;

      const result =
        await dharamshalaService.blockUnblockDharamshala(
          id,
          status
        );

      res.status(200).json(result);
    } catch (err) {
      logger.error(
        "blockUnblockDharamshala controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      res.status(200).json(
        buildResponse(
          500,
          err.message,
          null
        )
      );
    }
  };

/* ─────────────────────────────────────
   TOTAL COUNT
───────────────────────────────────── */

exports.getTotalDharamshalaCount =
  async (req, res) => {
    try {
      const result =
        await dharamshalaService.getTotalDharamshalaCount();

      res.status(200).json(result);
    } catch (err) {
      logger.error(
        "getTotalDharamshalaCount controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      res.status(200).json(
        buildResponse(
          500,
          err.message,
          null
        )
      );
    }
  };


/* ─────────────────────────────────────
   ADD / UPDATE COMMITTEE MEMBER
───────────────────────────────────── */

exports.addDharamshalaCommittee =
  async (req, res) => {
    try {
      logger.info(
        "addDharamshalaCommittee request",
        {
          body: req.body,
        }
      );

      const result =
        await dharamshalaService.addDharamshalaCommittee(
          {
            ...req.body,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "addDharamshalaCommittee controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            500,
            err.message,
            null
          )
        );
    }
  };

/* ─────────────────────────────────────
   GET ALL COMMITTEE MEMBERS
───────────────────────────────────── */

exports.getAllDharamshalaCommittee =
  async (req, res) => {
    try {
      let {
        pageIndex = 0,
        pageSize = 10,
        dharamshalaId,
        status,
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

      logger.info(
        "getAllDharamshalaCommittee request",
        {
          pageIndex,
          pageSize,
          dharamshalaId,
          status,
          searchText,
        }
      );

      const result =
        await dharamshalaService.getAllDharamshalaCommittee(
          {
            pageIndex,
            pageSize,
            dharamshalaId,
            status,
            searchText,
          }
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "getAllDharamshalaCommittee controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            500,
            err.message,
            null
          )
        );
    }
  };

/* ─────────────────────────────────────
   GET COMMITTEE MEMBER BY ID
───────────────────────────────────── */

exports.getDharamshalaCommitteeById =
  async (req, res) => {
    try {
      const { id } = req.params;

      logger.info(
        `getDharamshalaCommitteeById request ${id}`
      );

      const result =
        await dharamshalaService.getDharamshalaCommitteeById(
          id
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "getDharamshalaCommitteeById controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            500,
            err.message,
            null
          )
        );
    }
  };

/* ─────────────────────────────────────
   BLOCK / UNBLOCK / DELETE
───────────────────────────────────── */

exports.blockUnblockCommitteeMember =
  async (req, res) => {
    try {
      const { id, status } =
        req.body;

      logger.info(
        "blockUnblockCommitteeMember request",
        {
          id,
          status,
        }
      );

      const result =
        await dharamshalaService.blockUnblockCommitteeMember(
          id,
          status
        );

      return res
        .status(200)
        .json(result);
    } catch (err) {
      logger.error(
        "blockUnblockCommitteeMember controller error",
        {
          error: err.message,
          stack: err.stack,
        }
      );

      return res
        .status(200)
        .json(
          buildResponse(
            500,
            err.message,
            null
          )
        );
    }
  };