import React, { Component } from "react";
import { Redirect } from "react-router";
import app from "./base";

export default class Logout extends Component {
    state = {
        done: false
    };

    render() {
        if (this.state.done) {
            return <Redirect to='/' />;
        } else {
            return <div>Logging you out...</div>;
        }
    }

    componentDidMount() {
        app.auth().signOut().then(() => {
            this.setState({
                done: true
            });
        });
    }
}