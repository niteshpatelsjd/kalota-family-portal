
const Family =
  require("../models/Family");

const District =
  require("../models/District");

const Tehsil =
  require("../models/Tehsil");

const Village =
  require("../models/Village");

const logger =
  require("../utils/logger");

const DataConstant = {
  SHORT_ONE: 1,
  SHORT_TWO: 2,
};

/*
 * Generate short code
 */

const getCode = (text) => {

  if (!text) {
    return "NA";
  }

  return text
    .toString()
    .trim()
    .replace(/\s+/g, "")
    .substring(0, 3)
    .toUpperCase();
};

/*
 * Generate Family ID
 */

async function generateFamilyId(
  districtId,
  tehsilId,
  villageId
) {

  try {

    logger.info(
      "Generating Family ID"
    );

    /*
     * Fetch District
     */

    const district =
      await District.findOne({
        _id: districtId,
        status: {
          $in: [
            DataConstant.SHORT_ONE,
            DataConstant.SHORT_TWO,
          ],
        },
      });

    if (!district) {

      throw new Error(
        "District not found"
      );
    }

    /*
     * Fetch Tehsil
     */

    const tehsil =
      await Tehsil.findOne({
        _id: tehsilId,
        districtId,
        status: {
          $in: [
            DataConstant.SHORT_ONE,
            DataConstant.SHORT_TWO,
          ],
        },
      });

    if (!tehsil) {

      throw new Error(
        "Tehsil not found"
      );
    }

    /*
     * Fetch Village
     */

    const village =
      await Village.findOne({
        _id: villageId,
        districtId,
        tehsilId,
        status: {
          $in: [
            DataConstant.SHORT_ONE,
            DataConstant.SHORT_TWO,
          ],
        },
      });

    if (!village) {

      throw new Error(
        "Village not found"
      );
    }

    /*
     * Generate Codes
     */

    const districtCode =
      getCode(district.name);

    const tehsilCode =
      getCode(tehsil.name);

    const villageCode =
      getCode(village.name);

    /*
     * Generate Sequence
     */

    const totalFamilies =
      await Family.countDocuments();

    const sequence =
      String(
        totalFamilies + 1
      ).padStart(5, "0");

    /*
     * Final Family ID
     */

    const familyId =
      `KFP-${districtCode}-${tehsilCode}-${villageCode}-${sequence}`;

    logger.info(
      "Generated Family ID: %s",
      familyId
    );

    return familyId;

  } catch (err) {

    logger.error(
      "Error in generateFamilyId: %s",
      err.stack || err.message
    );

    throw err;
  }
}


module.exports = {generateFamilyId};