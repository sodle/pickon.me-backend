import React, { Component } from 'react';
import app from './base';
import firebase from 'firebase/app';
import 'firebase/auth';
import { Redirect } from 'react-router';
import Helmet from 'react-helmet';
import queryString from 'querystring';

interface ILoginProps {
    loading: boolean,
    location?: any
}

export default class Login extends Component<ILoginProps> {
    state = {
        user: null
    };

    render() {
        let search = queryString.parse(this.props.location.search.substr(1));
        if (this.state.user !== null) {
            if (search.hasOwnProperty('next') && typeof search.next === 'string') {
                return <Redirect to={search.next} />;
            } else {
                return <Redirect to='/' />;
            }
        } else {
            return (
                <div>
                    <Helmet>
                        <title>Log In - PickOn.Me</title>
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
                    const authProvider = new firebase.auth.GoogleAuthProvider();
                    authProvider.setCustomParameters({
                        prompt: 'select_account'
                    });
                    authProvider.addScope('profile');
                    authProvider.addScope('email');
                    app.auth().signInWithRedirect(authProvider);
                }
            });
        }
    }
}