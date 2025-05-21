"use strict";
/* jshint node: true */

var mongoose = require("mongoose");
var Photo = require("./photo");
/**
 * Define the Mongoose Schema for a Comment.
 */
var userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  location: String,
  description: String,
  occupation: String,
  login_name: String,
  password: String,
});

userSchema.statics.deleteUserAccount = async function (userId) {
  try {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    await Photo.deleteMany({ user_id: userId });
    const deletedUser = await this.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new Error("Error deleting user account");
    }
    return true;
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw new Error("Error deleting user account");
  }
};
/**
 * Create a Mongoose Model for a User using the userSchema.
 */
var User = mongoose.model("User", userSchema);

/**
 * Make this available to our application.
 */
module.exports = User;
