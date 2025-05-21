import React from 'react';
import {
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../topBar/TopBar';
import './userDetail.css';


class UserDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      deleteUserDialogOpen: false,
      loggedInUser: null
    };
  }

  componentDidMount() {
    this.fetchUserDetails();
    this.fetchLoggedInUser();
  }

  fetchLoggedInUser() {
    axios
      .get("/auth/user")  // Assuming this endpoint retrieves the logged-in user
      .then((response) => {
        this.setState({ loggedInUser: response.data });
      })
      .catch((error) => {
        console.error("Error fetching logged-in user:", error);
      });
  }

  componentDidUpdate(prevProps) {
    const { match } = this.props;
    const { userId } = match.params;

    if (prevProps.match.params.userId !== userId || !this.state.user) {
      this.fetchUserDetails();
    }
  }

  fetchUserDetails() {
    const { match } = this.props;
    const { userId } = match.params;

    axios
      .get(`/user/${userId}`)
      .then((response) => {
        this.setState({ user: response.data });
      })
      .catch((error) => {
        console.error('Error fetching user details:', error);
      });
  }

  handleDeleteUser = () => {
    const { user } = this.state;
    axios.delete(`/user/delete/${user._id}`)
      .then(() => {
        console.log('User deleted successfully');
        window.location.href = '/photo-share.html';
      })
      .catch((error) => {
        console.error('Error deleting user:', error);
      });
  };

  render() {
    const { user, deleteUserDialogOpen, loggedInUser } = this.state;
    const topNameValue = user ? `User details for ${user.first_name} ${user.last_name}` : '';

    return (
      <div>
        <TopBar topName={topNameValue} user={user} />
        {user ? (
          <div>
            <Grid container justifyContent="space-between">
              <Grid item>
                <Button component={Link} to={`/photos/${user._id}`} variant="contained" color="primary">
                  User Photos
                </Button>
              </Grid>
            </Grid>

            <div className="user-detail-box" style={{ marginTop: '16px' }}>
              <Typography variant="body1" className="user-detail-title">
                First Name
              </Typography>
              <Typography variant="body1" className="user-detail-value">
                {user.first_name}
              </Typography>
            </div>

            {/* Include other user details here */}

            <div className="user-detail-box">
              <Typography variant="body1" className="user-detail-title">
                Last Name
              </Typography>
              <Typography variant="body1" className="user-detail-value">
                {user.last_name}
              </Typography>
            </div>
            <div className="user-detail-box">
              <Typography variant="body1" className="user-detail-title">
                Location
              </Typography>
              <Typography variant="body1" className="user-detail-value">
                {user.location}
              </Typography>
            </div>
            <div className="user-detail-box">
              <Typography variant="body1" className="user-detail-title">
                Description
              </Typography>
              <Typography variant="body1" className="user-detail-value">
                {user.description}
              </Typography>
            </div>
            <div className="user-detail-box">
              <Typography variant="body1" className="user-detail-title">
                Occupation
              </Typography>
              <Typography variant="body1" className="user-detail-value">
                {user.occupation}
              </Typography>
            </div>

            {/* Conditionally render the delete user button */}
            {loggedInUser && loggedInUser._id === user._id && (
              <Button variant="contained" color="error" onClick={() => this.setState({ deleteUserDialogOpen: true })}>
                Delete User
              </Button>
            )}

            {/* Delete user confirmation dialog */}
            <Dialog open={deleteUserDialogOpen} onClose={() => this.setState({ deleteUserDialogOpen: false })}>
              <DialogTitle>Delete User</DialogTitle>
              <DialogContent>
                <Typography variant="body1">
                  Are you sure you want to delete your account? This action cannot be undone.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => this.setState({ deleteUserDialogOpen: false })} color="primary">
                  Cancel
                </Button>
                <Button onClick={this.handleDeleteUser} color="error">
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        ) : (
          <Typography variant="body1" className="user-detail-box loading-text">
            Loading user details...
          </Typography>
        )}
      </div>
    );
  }
}

export default UserDetails;
