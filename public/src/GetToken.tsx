import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router';
import app from './base';

interface IMatchProps {
    ticket: string
}

export default class GetToken extends Component<RouteComponentProps<IMatchProps>> {
    render() {
        return <div>
            Linking your account (ticket {this.props.match.params.ticket})...
        </div>;
    }
    componentDidMount() {
        app.auth().currentUser!.getIdToken(true).then(token => {
            let form = document.createElement('form');
            form.method = 'POST';
            form.action = 'https://us-central1-randomstudent-ba994.cloudfunctions.net/alexaContinueAccountLink';

            let ticketField = document.createElement('input');
            ticketField.type = 'hidden';
            ticketField.name = 'ticket';
            ticketField.value = this.props.match.params.ticket;
            form.appendChild(ticketField);

            let tokenField = document.createElement('input');
            tokenField.type = 'hidden';
            tokenField.name = 'token';
            tokenField.value = token;
            form.appendChild(tokenField);

            document.body.appendChild(form);

            form.submit();
        });
    }
}