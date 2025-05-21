/* eslint-disable import/order */
// My solution

import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Switch } from "react-router-dom";
import { Grid, Paper } from "@mui/material";
import "./styles/main.css";

// import necessary components
import TopBar from "./components/topBar/TopBar";
import UserDetail from "./components/userDetail/userDetail";
import UserList from "./components/userList/userList";
import UserPhotos from "./components/userPhotos/userPhotos";
import LoginRegister from "./components/loginRegister/loginRegister";
import Favorites from "./components/favorites/favorites";

import { Redirect } from "react-router";

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      main_content: undefined,
      user: undefined,
      mostRecentPhoto: null,
      mostCommentedPhoto: null,
    };
    this.changeMainContent = this.changeMainContent.bind(this);
    this.changeUser = this.changeUser.bind(this);
  }
  componentDidMount() {
    console.log("Component mounted!");
    console.log("Current User State:", this.state.user);
    this.fetchUserDetails();
  }

  userIsLoggedIn() {
    return this.state.user !== undefined;
  }
  fetchUserDetails = () => {
    const userId = this.state.user?._id; // Use optional chaining to avoid errors
    if (!userId) {
      console.error("User ID is undefined");
      return;
    }
    fetch(`/user/details/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.mostRecentPhoto && data.mostCommentedPhoto) {
          this.setState({
            mostRecentPhoto: data.mostRecentPhoto,
            mostCommentedPhoto: data.mostCommentedPhoto,
          });
        } else {
          console.error("Missing photo details in the response:", data);
        }
      })
      .catch((error) => console.error("Error fetching user details:", error));
  };

  changeMainContent = (main_content) => {
    this.setState({ main_content: main_content });
  };

  changeUser = (user) => {
    this.setState({ user: user });
    if (user === undefined) this.changeMainContent(undefined);
  };

  render() {
    const { mostRecentPhoto, mostCommentedPhoto } = this.state;
    return (
      <HashRouter>
        <div>
          <Grid container spacing={8}>
            <Grid item xs={12}>
              <TopBar
                main_content={this.state.main_content}
                user={this.state.user}
                changeUser={this.changeUser}
              />
            </Grid>
            <div className="main-topbar-buffer" />
            <Grid item sm={3}>
              <Paper className="main-grid-item">
                {this.userIsLoggedIn() ? <UserList /> : <div></div>}
              </Paper>
            </Grid>
            <Grid item sm={9}>
              <Paper className="main-grid-item">
                {mostRecentPhoto && (
                  <div>
                    <img
                      src={`/images/${mostRecentPhoto.file_name}`}
                      alt="Most Recent"
                    />
                    <p>Date Uploaded: {mostRecentPhoto.date_time}</p>
                  </div>
                )}
                {mostCommentedPhoto && (
                  <div>
                    <img
                      src={`/images/${mostCommentedPhoto.file_name}`}
                      alt="Most Commented"
                    />
                    <p>Comments Count: {mostCommentedPhoto.commentsCount}</p>
                  </div>
                )}
                {mostRecentPhoto && (
                  <button
                    onClick={() =>
                      this.props.history.push(
                        `/photos/${mostRecentPhoto.user_id}`
                      )
                    }
                  >
                    View Most Recent Photo
                  </button>
                )}
                {mostCommentedPhoto && (
                  <button
                    onClick={() =>
                      this.props.history.push(
                        `/photos/${mostCommentedPhoto.user_id}`
                      )
                    }
                  >
                    View Most Commented Photo
                  </button>
                )}
                {this.userIsLoggedIn() && (
                  <Route
                    path="/favorites"
                    render={(props) => (
                      <Favorites
                        {...props}
                        changeMainContent={this.changeMainContent}
                      />
                    )}
                  />
                )}
                <Switch>
                  {this.userIsLoggedIn() ? (
                    <Route
                      path="/users/:userId"
                      render={(props) => (
                        <UserDetail
                          {...props}
                          changeMainContent={this.changeMainContent}
                        />
                      )}
                    />
                  ) : (
                    <Redirect path="/users/:userId" to="/login-register" />
                  )}
                  {this.userIsLoggedIn() ? (
                    <Route
                      path="/photos/:userId"
                      render={(props) => (
                        <UserPhotos
                          {...props}
                          changeMainContent={this.changeMainContent}
                        />
                      )}
                    />
                  ) : (
                    <Redirect path="/photos/:userId" to="/login-register" />
                  )}
                  {this.userIsLoggedIn() ? (
                    <Route path="/" render={() => <div />} />
                  ) : (
                    <Route
                      path="/login-register"
                      render={(props) => (
                        <LoginRegister
                          {...props}
                          changeUser={this.changeUser}
                        />
                      )}
                    />
                  )}
                  {this.userIsLoggedIn() ? (
                    <Route path="/" render={() => <div />} />
                  ) : (
                    <Route
                      path="/"
                      render={(props) => (
                        <LoginRegister
                          {...props}
                          changeUser={this.changeUser}
                        />
                      )}
                    />
                  )}
                  {this.userIsLoggedIn() ? (
                    <Route
                      path="/favorites"
                      render={(props) => (
                        <Favorites
                          {...props}
                          changeMainContent={this.changeMainContent}
                        />
                      )}
                    />
                  ) : (
                    <Redirect path="/favorites" to="/login-register" />
                  )}
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(<PhotoShare />, document.getElementById("photoshareapp"));
