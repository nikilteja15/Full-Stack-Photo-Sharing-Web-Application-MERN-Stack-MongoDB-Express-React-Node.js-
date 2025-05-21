// Favorites.jsx
import React, { useState, useEffect } from "react";
import {
  Typography,
  Modal,
  Card,
  CardMedia,
  CardActionArea,
  CardActions,
  Button,
} from "@mui/material";
import axios from "axios";
import "./Favorites.css"; // Ensure this file contains the updated styles

const Favorites = ({ match }) => {
  const [favorites, setFavorites] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get("/favorite/photos");
        setFavorites(response.data.favorites);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, []);

  const handleOpenModal = (photo) => {
    setSelectedPhoto(photo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPhoto(null);
  };

  const handleRemoveFavorite = async (photoId) => {
    try {
      await axios.post(`/fav/remove/${photoId}`);
      setFavorites(favorites.filter((photo) => photo._id !== photoId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  return (
    <div>
      <Typography
        variant="h4"
        style={{ textAlign: "center", margin: "20px 0" }}
      >
        Favorite Photos
      </Typography>
      <div className="photo-list">
        {favorites.map((photo) => (
          <Card key={photo._id} className="photo-item">
            <CardActionArea onClick={() => handleOpenModal(photo)}>
              <CardMedia
                component="img"
                image={`/images/${photo.file_name}`}
                alt={`favorite-photo-${photo._id}`}
                className="thumbnail-image"
              />
            </CardActionArea>
            <CardActions className="photo-actions">
              <Button
                size="small"
                color="error"
                onClick={() => handleRemoveFavorite(photo._id)}
              >
                Remove
              </Button>
            </CardActions>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <div>
          <div
            className={modalOpen ? "modal-overlay" : "hidden"}
            onClick={handleCloseModal}
          ></div>
          <div className="modal-content">
            <Button onClick={handleCloseModal} className="close-modal-button">
              Close
            </Button>
            {selectedPhoto && (
              <>
                <img
                  src={`/images/${selectedPhoto.file_name}`}
                  alt={`favorite-photo-${selectedPhoto._id}`}
                  className="modal-image"
                />
                <Typography variant="h6" className="modal-caption">
                  Date Taken: {selectedPhoto.date_time}
                </Typography>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Favorites;
