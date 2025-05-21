"use strict";

const mongoose = require("mongoose");

const photoInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
    },
    photoId: {
      type: mongoose.Types.ObjectId,
      ref: "Photo",
    },
    type: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const photoInfo = mongoose.model("photoInfo", photoInfoSchema);

module.exports = photoInfo;
