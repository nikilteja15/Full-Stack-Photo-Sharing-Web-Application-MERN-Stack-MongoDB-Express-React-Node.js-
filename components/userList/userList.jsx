import React from 'react';
import { Divider, List, ListItem, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';  // Import Link from react-router-dom
import './userList.css';
import axios from 'axios'; // Import Axios

class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userList: [],
    };
  }

  componentDidMount() {
    this.fetchUserList();
  }

  fetchUserList() {
    axios.get('/user/list')
      .then((response) => {
        this.setState({ userList: response.data });
      })
      .catch((error) => {
        console.error('Error fetching user list:', error);
      });
  }

  render() {
    const { userList } = this.state;

    return (
      <div style={{ display: 'flex' }}>
        <div style={{ width: '400%' }}>
          {/* <Typography variant="body1">
            This is the user list, which takes up 3/12 of the window.
          </Typography> */}
          <List component="nav">
            {userList.map((user) => (
              <div key={user._id}>
                <ListItem>
                  {/* Use Link component to navigate to the user details page */}
                  <Button
                    component={Link}
                    to={`/users/${user._id}`}
                    className="ButtonStyle"  // Apply the CSS class here
                  >
                    {`${user.first_name} ${user.last_name}`}
                  </Button>
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        </div>
        <div style={{ width: '70%' }}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default UserList;