import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Container } from 'reactstrap';

import Home from './Home';
import Login from './Login';
import PrivateRoute from './PrivateRoute';
import app from './base';
import Logout from './Logout';
import ClassList from './ListClasses';
import Roster from './Roster';
import OauthTokenList from './OauthTokens';
import GetToken from './GetToken';
import Navbar from 'reactstrap/lib/Navbar';
import NavbarBrand from 'reactstrap/lib/NavbarBrand';
import NavbarToggler from 'reactstrap/lib/NavbarToggler';
import Collapse from 'reactstrap/lib/Collapse';
import Nav from 'reactstrap/lib/Nav';
import NavItem from 'reactstrap/lib/NavItem';
import NavLink from 'reactstrap/lib/NavLink';

interface IAppProps {};

interface IAppState {
  loading: boolean,
  authenticated: boolean,
  currentUser: firebase.User | null,
  isOpen: boolean
};

class App extends Component<IAppProps> {
  constructor(props: IAppProps) {
    super(props);

    this.toggle = this.toggle.bind(this);
  }

  state: IAppState = {
    loading: true,
    authenticated: false,
    currentUser: null,
    isOpen: false
  };
  
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  
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
      return <Container>
        Loading...
      </Container>;
    }

    return (
      <Router>
        <div>
          <Navbar light color='light' expand='md'>
            <NavbarBrand href='/'>Random Student Picker for Alexa</NavbarBrand>
            <NavbarToggler onClick={this.toggle} />
            <Collapse isOpen={this.state.isOpen} navbar>
              <Nav className='ml-auto' navbar>
                <NavItem>
                  <NavLink href='/'>Home</NavLink>
                </NavItem>
                {
                  (this.state.authenticated) ?
                    <>
                      <NavItem>
                        <NavLink href='/classes'>My Classes</NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink href='/logout'>Log Out</NavLink>
                      </NavItem>
                    </> :
                    <NavItem>
                      <NavLink href='/login'>Log In</NavLink>
                    </NavItem>
                }
              </Nav>
            </Collapse>
          </Navbar>
          <Container>
            <Route exact path='/' component={Home} />
            <Route exact path='/login' component={Login} />
            <Route exact path='/logout' component={Logout} />
            <PrivateRoute exact path='/classes' component={ClassList} authenticated={authenticated} />
            <PrivateRoute path='/classes/:id' component={Roster} authenticated={authenticated} />
            <PrivateRoute exact path='/tokens' component={OauthTokenList} authenticated={authenticated} />
            <PrivateRoute path='/alexa_token/:ticket' component={GetToken} authenticated={authenticated} />
          </Container>
        </div>
      </Router>
    );
  }
}

export default App;
