import React, { Component } from 'react';
import app from './base';

interface IHomeState {
    user: firebase.User | null
}

export default class Home extends Component {
    state: IHomeState = {
        user: null
    };
    render() {
        return (
            <div>
                <p>Hi!</p>
                {
                    (this.state.user !== null) ? 
                        <p>Logged in as {this.state.user!.displayName}. <a href='/logout'>Log out</a></p> :
                        <p><a href='/login'>Log in!</a></p>
                }
            </div>
        );
    }

    componentDidMount() {
      app.auth().onAuthStateChanged(user => {
        this.setState({
            user: user
        });
      });
    }
}