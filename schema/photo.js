"use strict";

const mongoose = require("mongoose");

/**
 * Define the Mongoose Schema for a Comment.
 */
const commentSchema = new mongoose.Schema({
  // The text of the comment.
  comment: String,
  // The date and time when the comment was created.
  date_time: { type: Date, default: Date.now },
  // The ID of the user who created the comment.
  user_id: mongoose.Schema.Types.ObjectId,
});

/**
 * Define the Mongoose Schema for a Photo.
 */
const photoSchema = new mongoose.Schema({
  // Name of the file containing the photo (in the project6/images directory).
  file_name: String,
  // The date and time when the photo was added to the database.
  date_time: { type: Date, default: Date.now },
  // The ID of the user who created the photo.
  user_id: mongoose.Schema.Types.ObjectId,

  likes: [
    {
      user_id: mongoose.Schema.Types.ObjectId,
      date_time: { type: Date, default: Date.now },
    },
  ],
  // Array of comment objects representing the comments made on this photo.
  comments: [commentSchema],
});

photoSchema.statics.deletePhoto = function (photoId, userId) {
  return this.findOneAndDelete({ _id: photoId, user_id: userId })
    .then((result) => {
      if (!result) {
        console.error("Photo not found for deletion");
        return null;
      }

      console.log("Photo deleted successfully");
      return result;
    })
    .catch((error) => {
      console.error("Error deleting photo:", error);
      throw error;
    });
};

photoSchema.statics.deleteComment = function (commentId) {
  return this.findOne({ "comments._id": commentId })
    .then((photo) => {
      if (!photo) {
        console.error("Photo not found for the given comment");
        return null;
      }
      const commentIndex = photo.comments.findIndex(
        (comment) => comment._id.toString() === commentId
      );

      if (commentIndex === -1) {
        console.error("Comment not found for deletion");
        return null;
      }
      photo.comments.splice(commentIndex, 1);
      return photo.save();
    })
    .then((result) => {
      if (!result) {
        return null;
      }

      console.log("Comment deleted successfully");
      return result;
    })
    .catch((error) => {
      console.error("Error deleting comment:", error);
      throw error;
    });
};

photoSchema.statics.toggleLike = async function (photoId, userId) {
  try {
    const photo = await this.findById(photoId);

    if (!photo) {
      console.error("Photo not found for liking");
      return null;
    }

    // Ensure that photo.likes is an array
    photo.likes = photo.likes || [];

    const userLikedIndex = photo.likes.findIndex(
      (like) =>
        like && like.user_id && like.user_id.toString() === userId.toString()
    );

    if (userLikedIndex === -1) {
      // Add a new like object to the array
      photo.likes.push({ user_id: userId });
    } else {
      // Remove the like object from the array
      photo.likes.splice(userLikedIndex, 1);
    }

    // Save the updated photo
    await photo.save();

    console.log("Like toggled successfully");
    return photo;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

/**
 * Create a Mongoose Model for a Photo using the photoSchema.
 */
const Photo = mongoose.model("Photo", photoSchema);

/**
 * Make this available to our application.
 */
module.exports = Photo;
