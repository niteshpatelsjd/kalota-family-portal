const mongoose = require("mongoose");

const personSchema =
  new mongoose.Schema(
    {
      familyRefId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Family",
      },

      nativeFamilyRefId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Family",
      },

      marriedFamilyRefId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Family",
      },

      familyId: {
        type: String,
        required: true,
      },

      relationType: {
        type: String,

        enum: [
          "HEAD",
          "FATHER",
          "MOTHER",
          "SPOUSE",
          "SON",
          "DAUGHTER",
          "BROTHER",
          "SISTER",
          "GRANDSON",
          "GRANDDAUGHTER",
        ],

        required: true,
      },

      familyHeadId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Person",
      },
      linkedPersonId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Person",
      },
      firstName: {
        type: String,
        required: true,
        trim: true,
      },

      middleName: {
        type: String,
        trim: true,
      },

      lastName: {
        type: String,
        required: true,
        trim: true,
      },

      gender: {
        type: String,

        enum: [
          "MALE",
          "FEMALE",
          "OTHER",
        ],
      },

      dob: String,

      mobile: String,

      email: String,

      occupation: {
        type: String,

        enum: [
          "Farmer",
          "Professional",
          "Business",
        ],
      },

      education: {
        type: String,

        enum: [
          "School",
          "Diploma",
          "Graduation",
          "Post Graduation",
        ],
      },

      maritalStatus: {
        type: String,

        enum: [
          "SINGLE",
          "MARRIED",
          "DIVORCED",
          "WIDOW",
          "WIDOWER",
        ],

        default: "SINGLE",
      },

      marriageDate: String,

      profileImage: String,

      fatherId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Person",
      },

      motherId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Person",
      },

      spouseIds: [
        {
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "Person",
        },
      ],

      childrenIds: [
        {
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "Person",
        },
      ],

      /*
       * Current Village
       */

      villageId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Village",
      },

      /*
       * Sasural / Parent Village
       * Only for married women/spouse
       */

      parentVillageId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Village",
      },

      spouseName: String,

      fatherFirstName: String,

      fatherMiddleName: String,

      fatherLastName: String,

      motherFirstName: String,

      motherLastName: String,

      grandFatherFirstName: String,

      grandFatherMiddleName: String,

      grandFatherLastName: String,

      status: {
        type: Number,

        enum: [0, 1, 2],

        default: 1,
      },

      isAlive: {
        type: Boolean,

        default: true,
      },

      deathDate: String,
    },

    {
      timestamps: true,
    }
  );

/*
 * Indexes
 */

personSchema.index({
  familyId: 1,
});

personSchema.index({
  familyRefId: 1,
  relationType: 1,
});

personSchema.index({
  villageId: 1,
});

personSchema.index({
  familyHeadId: 1,
});

personSchema.index({
  firstName: 1,
  lastName: 1,
});

personSchema.index({
  mobile: 1,
});

module.exports = mongoose.model(
  "Person",
  personSchema,
  "persons"
);
