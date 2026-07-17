const mongoose = require("mongoose");

const DharamshalaWebsiteSchema = new mongoose.Schema(
  {
    dharamshalaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala",
      required: true,
      unique: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    domain: {
      type: String,
      trim: true,
      default: "",
    },

    heroTitle: {
      type: String,
      trim: true,
      default: "",
    },

    heroSubtitle: {
      type: String,
      trim: true,
      default: "",
    },

    aboutTitle: {
      type: String,
      trim: true,
      default: "About Dharamshala",
    },

    aboutDescription: {
      type: String,
      trim: true,
      default: "",
    },

    bannerImage: {
      type: String,
      default: "",
    },

    logoImage: {
      type: String,
      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },

    alternateContactNumber: {
      type: String,
      trim: true,
      default: "",
    },

    contactEmail: {
      type: String,
      trim: true,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    bookingEnabled: {
      type: Boolean,
      default: true,
    },

    donationEnabled: {
      type: Boolean,
      default: true,
    },

    facilities: {
      type: [String],
      default: [],
    },

    rules: {
      type: [String],
      default: [],
    },

    gallery: {
      type: [
        {
          type: {
            type: String,
            enum: ["IMAGE", "VIDEO"],
            default: "IMAGE",
          },
          url: {
            type: String,
            required: true,
          },
          title: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },

    seoTitle: {
      type: String,
      trim: true,
      default: "",
    },

    seoDescription: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin_user",
      default: null,
      set: (value) => value || null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin_user",
      default: null,
      set: (value) => value || null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "dharamshala_website",
  DharamshalaWebsiteSchema
);
