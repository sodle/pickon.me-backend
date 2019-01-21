import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as OAuth2Server from 'oauth2-server';
import { pbkdf2Sync } from 'crypto';
import { dialogflow, Suggestions, BasicCard, Button } from 'actions-on-google';

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
    if (request.query.hasOwnProperty('keepwarm')) {
        response.send('warm');
        return;
    }
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
    if (request.query.hasOwnProperty('keepwarm')) {
        response.send('warm');
        return;
    }
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
    if (request.query.hasOwnProperty('keepwarm')) {
        response.send('warm');
        return;
    }
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
    if (request.query.hasOwnProperty('keepwarm')) {
        response.send('warm');
        return;
    }
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
    if (request.query.hasOwnProperty('keepwarm')) {
        response.send('warm');
        return;
    }
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

const app = dialogflow({
    debug: true,
    clientId: '837061064935-iovrpfo6mbe173janubuqre80dq12ghk.apps.googleusercontent.com'
});

app.intent('Default Welcome Intent', async (conv) => {
    const email = conv.user.profile.payload.email;
    const snap = await admin.auth().getUserByEmail(email)
        .then(user => {
            return firestore.doc(`/users/${user.uid}`).get();
        })
        .catch(() => {
            conv.add('Welcome! Please sign in at pickon.me to set up your account.');
            conv.add(new BasicCard({
                title: 'Please set up your pickon.me account.',
                text: `Please set up your account.`,
                buttons: new Button({
                    title: 'Sign in',
                    url: 'https://pickon.me'
                })
            }));
            conv.close();
        });
    if (snap) {
        const user = snap.data();
        if (!user.googleAssistantLinked) {
            await firestore.doc(`/users/${user.uid}`).update({
                googleAssistantLinked: true
            }).then(() => {
                console.log('Initial account link!');
            }).catch(() => {
                console.error(`Couldn't update account link state?`);
            });
        }
        if (Object.keys(user.classes).length === 0) {
            conv.add(`You don't have any class periods set up. Please create some at pickon.me.`);
            conv.add(new BasicCard({
                title: `Set up class periods.`,
                text: `Please set up your classes.`,
                buttons: new Button({
                    title: 'Add classes',
                    url: `https://pickon.me/classes`
                })
            }));
            conv.close();
        }
        else if (Object.keys(user.classes).length === 1) {
            const period = Object.keys(user.classes)[0];
            const roster = user.classes[period];
            if (roster.length === 0) {
                conv.add(`There are no students in period ${period}.. Please add some at pickon.me.`);
                conv.add(new BasicCard({
                    title: `Add students to period ${period}.`,
                    text: `Please set up period ${period}`,
                    buttons: new Button({
                        title: 'Edit class',
                        url: `https://pickon.me/classes/${period}`
                    })
                }));
                conv.close();
            } else {
                const student = roster[Math.floor(Math.random() * roster.length)];
                conv.add(student);
                conv.add(new BasicCard({
                    title: 'Random Student',
                    text: student
                }));
                conv.close();
            }
        } else {
            conv.ask('From which period?');
            if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
                conv.add(new Suggestions(Object.keys(user.classes)));
            }
        }
    } else {
        conv.add('Sorry, an error occurred.');
        conv.close();
    }
});

app.intent('From Period Intent', async (conv, params) => {
    const email = conv.user.profile.payload.email;
    const snap = await admin.auth().getUserByEmail(email)
        .then(user => {
            return firestore.doc(`/users/${user.uid}`).get();
        })
        .catch(() => {
            conv.add('Welcome! Please sign in at pickon.me to set up your account.');
            conv.add(new BasicCard({
                title: 'Please set up your pickon.me account.',
                text: `Please set up your account.`,
                buttons: new Button({
                    title: 'Sign in',
                    url: 'https://pickon.me'
                })
            }));
        });
    if (snap) {
        const user = snap.data();
        if (!user.googleAssistantLinked) {
            await firestore.doc(`/users/${user.uid}`).update({
                googleAssistantLinked: true
            }).then(() => {
                console.log('Initial account link!');
            }).catch(() => {
                console.error(`Couldn't update account link state?`);
            });
        }
        const period = params.ClassPeriod.toString().toUpperCase();
        if (user.classes.hasOwnProperty(period)) {
            const roster = user.classes[period];
            if (roster.length === 0) {
                conv.add(`There are no students in period ${period}.. Please add some at pickon.me.`);
                conv.add(new BasicCard({
                    title: `Add students to period ${period}.`,
                    text: `Please set up period ${period}.`,
                    buttons: new Button({
                        title: 'Edit class',
                        url: `https://pickon.me/classes/${period}`
                    })
                }));
            } else {
                const student = roster[Math.floor(Math.random() * roster.length)];
                conv.add(student);
                conv.add(new BasicCard({
                    title: 'Random Student',
                    text: student
                }));
            }
        } else {
            conv.add(`You haven't set up a period ${period}.. Please configure it at pickon.me.`);
            conv.add(new BasicCard({
                title: `Set up period ${period}.`,
                text: `Please set up period ${period}.`,
                buttons: new Button({
                    title: 'Add class',
                    url: `https://pickon.me/classes`
                })
            }));
        }
    } else {
        conv.add('Sorry, an error occurred.');
    }
    conv.close();
});

app.fallback(conv => {
    conv.add(`Sorry, I'm not sure about that.`);
});

exports.dialogflowFulfillment = functions.https.onRequest(app);
