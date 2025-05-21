import React from "react";
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import TopBar from "../topBar/TopBar";
import "./userPhotos.css";

class UserPhotos extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      photos: [],
      user: null,
      comment: null,
      new_comment: "",
      add_comment: false,
      current_photo_id: null,
      loggedInUser: null,
    };

    this.handleShowAddComment = this.handleShowAddComment.bind(this);
    this.handleNewCommentChange = this.handleNewCommentChange.bind(this);
    this.handleCancelAddComment = this.handleCancelAddComment.bind(this);
    this.handleSubmitAddComment = this.handleSubmitAddComment.bind(this);
    this.handleToggleLike = this.handleToggleLike.bind(this);
    this.hasUserLikedPhoto = this.hasUserLikedPhoto.bind(this);
    this.handleFavorite = this.handleFavorite.bind(this);
    this.isPhotoFavorited = this.isPhotoFavorited.bind(this);
  }

  componentDidMount() {
    this.fetchUserPhotosAndDetails();
    this.fetchLoggedInUser();
  }

  fetchLoggedInUser() {
    axios
      .get("/auth/user")
      .then((response) => {
        this.setState({ loggedInUser: response.data });
      })
      .catch((error) => {
        console.error("Error fetching logged-in user:", error);
      });
  }

  async fetchUserPhotosAndDetails() {
    const { match } = this.props;
    const { userId } = match.params;

    try {
      const [photosResponse, userResponse] = await Promise.all([
        axios.get(`/photosOfUser/${userId}`),
        axios.get(`/user/${userId}`),
      ]);

      const photos = photosResponse.data;

      const likesPromises = photos.map(async (photo) => {
        const likesResponse = await axios.get(`/photos/${photo._id}/likes`);
        return {
          ...photo,
          likesCount: likesResponse.data.likesCount || 0,
        };
      });

      const photosWithLikes = await Promise.all(likesPromises);

      this.setState({
        photos: photosWithLikes,
        user: userResponse.data,
        comment: userResponse.data ? userResponse.data.comment : null,
      });

      const favoritesPromises = photosWithLikes.map(async (photo) => {
        const favoriteResponse = await axios.get(
          `/favorite/photo/${photo._id}`
        );
        return {
          ...photo,
          isFavorited: favoriteResponse.data.isFavorited || false,
        };
      });

      const photosWithFavorites = await Promise.all(favoritesPromises);
      this.setState({ photos: photosWithFavorites });
    } catch (error) {
      console.error("Error fetching user photos and details:", error);
    }
  }

  hasUserLikedPhoto(photo) {
    const { loggedInUser } = this.state;
    const result = loggedInUser && photo.userLiked;
    return result;
  }

  isPhotoFavorited(photo) {
    return photo.isFavorited;
  }

  handleShowAddComment = (photo_id) => {
    this.setState({
      add_comment: true,
      current_photo_id: photo_id,
    });
  };

  renderAddCommentDialog() {
    const { add_comment, current_photo_id, new_comment } = this.state;
    return (
      <Dialog open={add_comment && current_photo_id !== null}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a new comment for the photo.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            label="Comment"
            multiline
            rows={4}
            fullWidth
            variant="standard"
            onChange={this.handleNewCommentChange}
            value={new_comment}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleCancelAddComment}>Cancel</Button>
          <Button
            onClick={() =>
              this.handleSubmitAddComment(this.state.current_photo_id)
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  handleNewCommentChange = (event) => {
    this.setState({
      new_comment: event.target.value,
    });
  };

  handleCancelAddComment = () => {
    this.setState({
      add_comment: false,
      new_comment: "",
      current_photo_id: null,
    });
  };

  handleSubmitAddComment = (photo_id) => {
    const { new_comment } = this.state;

    axios
      .post(`/commentsOfPhoto/${photo_id}`, { comment: new_comment })
      .then(() => {
        console.log("Comment added to the database successfully");
        this.setState({
          add_comment: false,
          new_comment: "",
          current_photo_id: null,
        });
        this.fetchUserPhotosAndDetails();
      })
      .catch((error) => {
        console.error("Error adding comment:", error);
      });
  };

  handleToggleLike = async (photoId) => {
    try {
      const response = await axios.post(`/like/photo/${photoId}`);
      console.log("Toggle like success:", response.data);

      const updatedPhotos = this.state.photos.map((photo) => {
        if (photo._id === photoId) {
          return {
            ...photo,
            userLiked: !photo.userLiked,
            likesCount: response.data.likesCount || 0,
          };
        }
        return photo;
      });

      this.setState({ photos: updatedPhotos });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  handleFavorite = async (photoId) => {
    try {
      const response = await axios.post(`/favorite/photo/${photoId}`);
      console.log("Toggle favorite success:", response.data);

      const updatedPhotos = this.state.photos.map((photo) => {
        if (photo._id === photoId) {
          return {
            ...photo,
            isFavorited: !photo.isFavorited,
          };
        }
        return photo;
      });

      this.setState({ photos: updatedPhotos });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  handleDeleteComment = async (commentId) => {
    try {
      const response = await axios.delete(
        `/dcomment/photos/deleteComment/${commentId}`
      );
      console.log("Delete comment success:", response.data);

      this.setState({
        add_comment: false,
        new_comment: "",
        current_photo_id: null,
      });

      this.fetchUserPhotosAndDetails();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  handleDeletePhoto = (photoId) => {
    axios
      .delete(`/photo/delete/${photoId}`)
      .then(() => {
        console.log("Photo deleted successfully");
        this.fetchUserPhotosAndDetails();
      })
      .catch((error) => {
        console.error("Error deleting photo:", error);
      });
  };

  render() {
    const { photos, user, comment, loggedInUser } = this.state;
    const { match } = this.props;
    const { userId } = match.params;
    const topNameValue = user
      ? `User photos for ${user.first_name} ${user.last_name}`
      : "";

    return (
      <div>
        <TopBar topName={topNameValue} user={user} />
        <Button
          component={Link}
          to={`/users/${userId}`}
          variant="contained"
          className="UserPhotos__ButtonLink"
        >
          User Details
        </Button>
        <Typography variant="h4" className="UserPhotos__Header">
          User Photos
        </Typography>
        <div className="UserPhotos__photo-list">
          {photos.map((photo) => (
            <div key={photo._id} className="UserPhotos__photo-item">
              <img
                src={`/images/${photo.file_name}`}
                className="UserPhotos__photo-image"
                alt={`user-${userId}-photo-${photo._id}`}
              />
              <div
                className="UserPhotos__photo-box"
                style={{ marginTop: "16px" }}
              >
                <Typography
                  variant="caption"
                  className="UserPhotos__photo-title"
                >
                  Date Taken
                </Typography>
                <Typography variant="body1" className="UserPhotos__photo-value">
                  {photo.date_time}
                </Typography>
              </div>

              {photo.comments && photo.comments.length > 0 && (
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>Comments:</p>
                  {photo.comments.map((userComment) => (
                    <div
                      key={userComment._id}
                      className="user-photo-box"
                      style={{ marginTop: "16px" }}
                    >
                      <p>{userComment.comment}</p>
                      <p>
                        <b>Commented ON:</b> {userComment.date_time}
                      </p>
                      <p>
                        <b>Commented BY:</b>
                        <Link to={`/users/${userComment.user._id}`}>
                          {userComment.user.first_name}{" "}
                          {userComment.user.last_name}
                        </Link>
                      </p>
                      {loggedInUser &&
                        loggedInUser._id === userComment.user._id && (
                          <Button
                            onClick={() =>
                              this.handleDeleteComment(userComment._id)
                            }
                            variant="outlined"
                            color="error"
                          >
                            Delete Comment
                          </Button>
                        )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Button
                  className={`like-button ${
                    this.hasUserLikedPhoto(photo) ? "liked" : ""
                  }`}
                  onClick={() => this.handleToggleLike(photo._id)}
                >
                  {this.hasUserLikedPhoto(photo) ? "Unlike" : "Like"}
                </Button>
                <span>{photo.likesCount} Likes</span>
                <Button
                  className={`favorite-button ${
                    this.isPhotoFavorited(photo) ? "favorited" : ""
                  }`}
                  onClick={() => this.handleFavorite(photo._id)}
                >
                  {this.isPhotoFavorited(photo) ? "Unfavorite" : "Favorite"}
                </Button>
              </div>

              {loggedInUser && loggedInUser._id === photo.user_id && (
                <Button
                  onClick={() => this.handleDeletePhoto(photo._id)}
                  variant="outlined"
                  color="error"
                >
                  Delete Photo
                </Button>
              )}
              <Button
                variant="contained"
                onClick={() => this.handleShowAddComment(photo._id)}
              >
                Add Comment
              </Button>
            </div>
          ))}
        </div>

        {user ? (
          <div>
            {comment && (
              <div className="user-photo-box" style={{ marginTop: "16px" }}>
                <Typography variant="caption" className="user-photo-title">
                  Comment
                </Typography>
                <Typography variant="body1" className="user-photo-value">
                  {comment}
                </Typography>
              </div>
            )}
          </div>
        ) : (
          <Typography variant="body1" className="user-detail-box loading-text">
            Loading user details...
          </Typography>
        )}

        {this.renderAddCommentDialog()}
      </div>
    );
  }
}

export default UserPhotos;
