import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as OAuth2Server from 'oauth2-server';
import { pbkdf2Sync } from 'crypto';

admin.initializeApp();
const firestore = admin.firestore();
firestore.settings({
    timestampsInSnapshots: true
});

const oauth = new OAuth2Server({
    model: {
        getAuthorizationCode: async (authorization_code) => {
            console.log('getAuthCode');
            return firestore.doc(`/auth_codes/${authorization_code}`).get().then(codeSnap => {
                const code = codeSnap.data();
                console.log(code);
                return {
                    code: code.code,
                    expiresAt: code.expiresAt.toDate(),
                    redirectUri: code.redirectUri,
                    client: {
                        id: code.clientId
                    },
                    user: {
                        id: code.userId
                    }
                };
            })
        },
        getClient: async (clientId, clientSecret) => {
            console.log('getClient');
            return firestore.doc(`/clients/${clientId}`).get().then(client => {
                if (clientSecret === null) {
                    console.log(client.data())
                    return {
                        id: clientId,
                        grants: ['authorization_code', 'refresh_token'],
                        redirectUris: client.data().redirectUris
                    };
                }
                const hashedClientSecret = pbkdf2Sync(clientSecret, clientId, 1000, 64, 'sha256').toString('hex');
                if (client.data().hashedSecret === hashedClientSecret) {
                    return {
                        id: clientId,
                        grants: ['authorization_code', 'refresh_token'],
                        redirectUris: client.data().redirectUris
                    };
                } else {
                    return null;
                }
            });
        },
        saveToken: async (token, client, user) => {
            console.log('saveToken');
            return Promise.all([
                firestore.doc(`/access_tokens/${token.accessToken}`).set({
                    code: token.accessToken,
                    expiresAt: token.accessTokenExpiresAt,
                    clientId: client.id,
                    userId: user.id
                }),
                firestore.doc(`/refresh_tokens/${token.refreshToken}`).set({
                    code: token.refreshToken,
                    expiresAt: token.refreshTokenExpiresAt,
                    clientId: client.id,
                    userId: user.id
                })
            ]).then(() => {
                return {
                    accessToken: token.accessToken,
                    accessTokenExpiresAt: token.accessTokenExpiresAt,
                    refreshToken: token.refreshToken,
                    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                    client,
                    user
                };
            }).catch(err => {
                console.error(err);
                return {
                    accessToken: token.accessToken,
                    accessTokenExpiresAt: token.accessTokenExpiresAt,
                    refreshToken: token.refreshToken,
                    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                    client,
                    user
                };
            });
        },
        saveAuthorizationCode: async (code, client, user) => {
            console.log('saveAuthCode');
            return firestore.doc(`/auth_codes/${code.authorizationCode}`).set({
                code: code.authorizationCode,
                expiresAt: code.expiresAt,
                redirectUri: code.redirectUri,
                clientId: client.id,
                userId: user.id
            }).then(() => {
                return {
                    authorizationCode: code.authorizationCode,
                    expiresAt: code.expiresAt,
                    redirectUri: code.redirectUri,
                    client: client,
                    user: user
                };
            });
        },
        revokeAuthorizationCode: async (code) => {
            console.log('revokeAuthCode');
            return firestore.doc(`/auth_codes/${code.authorizationCode}`).delete().then(() => true);
        },
        revokeToken: () => true,
        getAccessToken: async (token) => {
            console.log('getAccessToken');
            return firestore.doc(`/access_tokens/${token}`).get().then(snap => {
                const accessToken = snap.data();
                return {
                    accessToken: accessToken.code,
                    accessTokenExpiresAt: accessToken.expiresAt.toDate(),
                    client: {
                        id: accessToken.clientId,
                        grants: ['authorization_code', 'refresh_token']
                    },
                    user: {
                        id: accessToken.userId
                    }
                };
            })
        },
        getRefreshToken: async (token) => {
            console.log('getRefreshToken');
            return firestore.doc(`/refresh_tokens/${token}`).get().then(snap => {
                const refreshToken = snap.data();
                return {
                    refreshToken: refreshToken.code,
                    refreshTokenExpiresAt: refreshToken.expiresAt.toDate(),
                    client: {
                        id: refreshToken.clientId
                    },
                    user: {
                        id: refreshToken.userId
                    }
                };
            })
        },
        verifyScope: async () => {
            console.log('verifyScope');
            return true
        }
    }
});

export const alexaStartAccountLink = functions.https.onRequest((request, response) => {
    if (request.query.hasOwnProperty('redirect_uri')) {
        request.query.redirectUri = request.query.redirect_uri;
    }
    firestore.collection('/alexa_accountlink_tickets').add({
        method: request.method,
        query: request.query,
        headers: request.headers
    }).then(ticket => {
        response.redirect(`https://randomstudent-ba994.firebaseapp.com/alexa_token/${ticket.id}`);
    }).catch(err => response.status(500).send(err));
});

export const alexaContinueAccountLink = functions.https.onRequest((request, response) => {
    console.log('launch');
    firestore.doc(`/alexa_accountlink_tickets/${request.body.ticket}`).get().then(snap => {
        const ticket = snap.data();
        console.log(ticket);
        const o2Req = new OAuth2Server.Request(ticket);
        admin.auth().verifyIdToken(request.body.token).then(user => {
            console.log(user);
            console.log(request.body);
            oauth.authorize(o2Req, new OAuth2Server.Response(response), {
                authenticateHandler: {handle: () => {return {id: user.uid}}}
            }).then(code => {
                snap.ref.delete().then(() => {
                    console.log('redirect');
                    response.redirect(`${o2Req.query.redirectUri}?code=${code.authorizationCode}&state=${o2Req.query.state}`);
                }).catch(err => response.status(500).send(err));
            }).catch(err => {
                response.status(500).send(err);
            });
        }).catch(err => response.status(403).send(err));
    }).catch(err => response.status(400).send(err));
});

export const alexaGetToken = functions.https.onRequest((request, response) => {
    console.log(request.query);
    console.log(request.body);
    oauth.token(new OAuth2Server.Request(request), new OAuth2Server.Response(response)).then(token => {
        console.log(token);
        response.send({
            access_token: token.accessToken,
            expires_in: 3600,
            refresh_token: token.refreshToken,
            token_type: 'bearer'
        });
    }).catch(err => {
        console.error(err);
        response.status(500).send(err);
    });
});

export const listClassPeriods = functions.https.onRequest((request, response) => {
    oauth.authenticate(new OAuth2Server.Request(request), new OAuth2Server.Response(response)).then(token => {
        firestore.doc(`/users/${token.user.id}`).get().then(snap => {
            const user = snap.data();
            response.send({
                periods: Object.keys(user.classes)
            });
        }).catch(err => response.status(404).send(err));
    }).catch(err => response.status(403).send(err));
});

export const pickRandomStudent = functions.https.onRequest((request, response) => {
    oauth.authenticate(new OAuth2Server.Request(request), new OAuth2Server.Response(response)).then(token => {
        firestore.doc(`/users/${token.user.id}`).get().then(snap => {
            const user = snap.data();
            if (user.classes.hasOwnProperty(request.query.class_period.toUpperCase())) {
                const students = user.classes[request.query.class_period.toUpperCase()];
                if (students.length > 0) {
                    const student = students[Math.floor(Math.random() * students.length)];
                    response.send({
                        student
                    });
                } else {
                    response.status(400).send('There are no students in this class.');
                }
            } else {
                response.status(404).send('No such class.');
            }
        }).catch(err => response.status(500).send(err));
    }).catch(err => response.status(403).send(err));
});
