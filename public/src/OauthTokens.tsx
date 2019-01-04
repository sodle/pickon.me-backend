import React, { Component } from 'react';
import app from './base';
import { Redirect } from 'react-router';
import { randomBytes, pbkdf2Sync } from 'crypto';

interface IToken {
    name: string,
    clientId: string,
    hashedSecret: string
}

interface ITokensState {
    error: boolean,
    tokens: IToken[]
    secrets: {
        [key: string]: string
    }
}

export default class OauthTokenList extends Component {
    state: ITokensState = {
        error: false,
        tokens: [],
        secrets: {}
    }

    ref: firebase.firestore.CollectionReference

    constructor(props: React.Props<OauthTokenList>) {
        super(props);
        const firestore = app.firestore();
        firestore.settings({
            timestampsInSnapshots: true
        });
        this.ref = firestore.collection('/clients/');
    }

    render() {
        if (this.state.error) {
            return <Redirect to="/" />;
        } else {
            return (<div>
                <h1>OAuth Tokens</h1>
                <div>
                    <button onClick={() => {
                        const tokenName = prompt('Name for new token?');
                        if (tokenName === null) {
                            return;
                        }
                        const clientId = randomBytes(32).toString('hex');
                        const clientSecret = randomBytes(32).toString('hex');
                        const hashedClientSecret = pbkdf2Sync(clientSecret, clientId, 1000, 64, 'sha256').toString('hex');
                        this.ref.doc(clientId).set({
                            name: tokenName,
                            clientId: clientId,
                            hashedSecret: hashedClientSecret,
                            redirectUris: [
                                'https://sjodle.com',
                                `https://alexa.amazon.co.jp/api/skill/link/${tokenName}`,
                                `https://pitangui.amazon.com/api/skill/link/${tokenName}`,
                                `https://layla.amazon.com/api/skill/link/${tokenName}`
                            ]
                        }).then(() => {
                            console.log(`Client ID: ${clientId}\nClient Secret: ${clientSecret}`);
                            const newSecret: {[key: string]: string} = {};
                            newSecret[clientId] = clientSecret;
                            this.setState({secrets: newSecret});
                        });
                    }}>+ Create New Token</button>
                </div>
                {(this.state.tokens.length > 0) ?
                    this.state.tokens.map(token => 
                        <div key={token.clientId}>
                            <h2>{token.name} <button onClick={() => {
                                if (confirm(`Revoke token ${token.name}?`)) {
                                    this.ref.doc(token.clientId).delete();
                                }
                            }}>Revoke</button></h2>
                            <div>
                                {token.clientId}
                            </div>
                            {(this.state.secrets.hasOwnProperty(token.clientId)) ?
                                <div>
                                    {this.state.secrets[token.clientId]}
                                </div> : null}
                        </div>
                    ) :
                    <div>
                        No tokens created.
                    </div>
                }
            </div>);
        }
    }

    componentDidMount() {
        this.ref.onSnapshot(snap => {
            this.setState({tokens: snap.docs.map(d => d.data())});
        }, () => this.setState({error: true}));
    }
}
