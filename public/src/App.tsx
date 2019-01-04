import React, { Component } from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';

import Home from './Home';
import Login from './Login';
import PrivateRoute from './PrivateRoute';
import app from './base';
import Logout from './Logout';
import ClassList from './ListClasses';
import Roster from './Roster';
import OauthTokenList from './OauthTokens';
import GetToken from './GetToken';

class App extends Component {
  state = {
    loading: true,
    authenticated: false,
    user: null
  };
  
  componentWillMount() {
    app.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({
          authenticated: true,
          currentUser: user,
          loading: false
        });
      } else {
        this.setState({
          authenticated: false,
          currentUser: null,
          loading: false
        });
      }
    });
  }

  render() {
    const { authenticated, loading } = this.state;

    if (loading) {
      return <p>Loading...</p>;
    }

    return (
      <Router>
        <div>
          <Route exact path='/' component={Home} />
          <Route exact path='/login' component={Login} />
          <Route exact path='/logout' component={Logout} />
          <PrivateRoute exact path='/classes' component={ClassList} authenticated={authenticated} />
          <PrivateRoute path='/classes/:id' component={Roster} authenticated={authenticated} />
          <PrivateRoute exact path='/tokens' component={OauthTokenList} authenticated={authenticated} />
          <PrivateRoute path='/alexa_token/:ticket' component={GetToken} authenticated={authenticated} />
        </div>
      </Router>
    );
  }
}

export default App;
