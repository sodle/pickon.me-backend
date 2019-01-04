import React, { Component } from 'react';
import app from './base';
import Firebase from 'firebase';
import { Redirect } from 'react-router';

export default class Login extends Component {
    state = {
        user: null
    };

    render() {
        if (this.state.user !== null) {
            return <Redirect to='/' />;
        } else {
            console.log(this.state.user);
            app.auth().getRedirectResult().then(result => {
                console.log(result);
                if (result.user !== null) {
                    this.setState({
                        user: result.user
                    });
                }
            });
            return (
                <div>
                    Login!
                </div>
            );
        }
    }
    componentDidMount() {
        if (this.state.user === null) {
            const authProvider = new Firebase.auth.GoogleAuthProvider();
            authProvider.addScope('profile');
            authProvider.addScope('email');
            app.auth().signInWithRedirect(authProvider);
        }
    }
}