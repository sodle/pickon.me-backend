import React, { Component } from 'react';
import app from './base';
import Firebase from 'firebase';
import { Redirect } from 'react-router';
import Helmet from 'react-helmet';

interface ILoginProps {
    loading: boolean
}

export default class Login extends Component<ILoginProps> {
    state = {
        user: null
    };

    render() {
        if (this.state.user !== null) {
            return <Redirect to='/' />;
        } else {
            return (
                <div>
                    <Helmet>
                        <title>Log In - Random Student Picker for Alexa</title>
                    </Helmet>
                    Login!
                </div>
            );
        }
    }
    componentDidMount() {
        if (!this.props.loading) {
            app.auth().getRedirectResult().then(result => {
                if (result.user !== null) {
                    this.setState({
                        user: result.user
                    });
                } else {
                    const authProvider = new Firebase.auth.GoogleAuthProvider();
                    authProvider.addScope('profile');
                    authProvider.addScope('email');
                    app.auth().signInWithRedirect(authProvider);
                }
            });
        }
    }
}