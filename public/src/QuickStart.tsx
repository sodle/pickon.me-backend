import React, { Component } from "react";
import Container from "reactstrap/lib/Container";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import Helmet from "react-helmet";
import Badge from "reactstrap/lib/Badge";
import app from "./base";
import Button from "reactstrap/lib/Button";
import InputGroup from "reactstrap/lib/InputGroup";
import InputGroupAddon from "reactstrap/lib/InputGroupAddon";
import Input from "reactstrap/lib/Input";

interface ICourseListing {
    [key: string]: Array<string>
}

interface INewStudentState {
    [key: string]: string
}

interface IUserState {
    user: {
        joinDate: Date | null,
        classes: ICourseListing
    },
    newStudent: INewStudentState,
    tokens: []
}

export default class QuickStart extends Component {
    state: IUserState = {
        user: {
            joinDate: null,
            classes: {}
        },
        newStudent: {},
        tokens: []
    };

    ref: firebase.firestore.DocumentReference
    tokenRef: firebase.firestore.Query

    constructor(props: React.Props<QuickStart>) {
        super(props);
        const firestore = app.firestore();
        firestore.settings({
            timestampsInSnapshots: true
        });
        this.ref = firestore.doc(`/users/${app.auth().currentUser!.uid}`);
        this.tokenRef = firestore.collection('/auth_codes').where('userId', '==', app.auth().currentUser!.uid);
    }

    render() {
        return (
            <Container>
                <Helmet>
                    <title>Get Started - Random Student Picker for Alexa</title>
                </Helmet>
                <Row>
                    <Col xs='12'>
                        <h1>Let's get started</h1>
                    </Col>
                </Row>
                <Row>
                    <Col xs='12'>
                        <Container>
                            <Row>
                                <Col xs='1'>
                                    <Badge color='success'><h2>&#10004;</h2></Badge>
                                </Col>
                                <Col xs='11'>
                                    <h2>Sign in with Google</h2>
                                </Col>
                            </Row>
                        </Container>
                        <Container>
                            <Row>
                                <Col xs='1'>
                                    {
                                        (Object.keys(this.state.user.classes).length > 0) ?
                                        <Badge color='success'><h2>&#10004;</h2></Badge> :
                                        null
                                    }
                                </Col>
                                <Col xs='11'>
                                    <h2>Enter your class lists</h2>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs='12'>
                                    <Button color='success' onClick={() => {{
                                        let name = '';
                                        while (!/^[a-zA-Z0-9]$/.test(name)) {
                                            const input = prompt('Class period? (must be one letter or number)');
                                            if (input === null) {
                                                return;
                                            } else {
                                                name = input.toUpperCase();
                                            }
                                        }
                                        if (this.state.user.classes.hasOwnProperty(name)) {
                                            alert(`Class ${name} already exists!`);
                                        } else {
                                            let classes = Object.assign({}, this.state.user.classes);
                                            classes[name] = [];
                                            this.ref.update({classes});
                                        }
                                    }}}>+ Add a Class Period</Button>
                                </Col>
                            </Row>
                            <Row>
                                {
                                    Object.keys(this.state.user.classes).map(c => {
                                        return <Col md='4' key={c}>
                                            <h3>Period {c} <Button color='danger' onClick={() => {
                                                if (confirm(`Really delete period ${c}?`)) {
                                                    let classes = Object.assign({}, this.state.user.classes);
                                                    delete classes[c];
                                                    this.ref.update({classes});
                                                }
                                            }}>X</Button></h3>
                                            <ul>
                                                {this.state.user.classes[c].map((s, i) => <li key={i}>{s} <Button close onClick={() => {
                                                    let classes = Object.assign({}, this.state.user.classes);
                                                    classes[c].splice(i, 1);
                                                    this.ref.update({classes});
                                                }}>X</Button></li>)}
                                            </ul>
                                            <InputGroup>
                                                <Input onChange={(e) => {
                                                    const newState: INewStudentState ={...this.state.newStudent};
                                                    newState[c] = e.target.value;
                                                    this.setState({
                                                        newStudent: newState
                                                    });
                                                }} onKeyUp={(e) => {
                                                    if (e.key === 'Enter') {
                                                        let classes = Object.assign({}, this.state.user.classes);
                                                        classes[c].push(this.state.newStudent[c]);
                                                        this.ref.update({classes});
                                                        e.currentTarget.value = '';
                                                        const newState: INewStudentState ={...this.state.newStudent};
                                                        newState[c] = '';
                                                        this.setState({
                                                            newStudent: newState
                                                        });
                                                    }
                                                }} />
                                                <InputGroupAddon addonType="append">&#8629;</InputGroupAddon>
                                            </InputGroup>
                                        </Col>;
                                    })
                                }
                            </Row>
                            <Row>
                                <Col xs='1'>
                                    {
                                        (this.state.tokens.length > 0) ?
                                        <Badge color='success'><h2>&#10004;</h2></Badge> :
                                        null
                                    }
                                </Col>
                                <Col xs='11'>
                                    <h2>Connect your device</h2>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs='12'>
                                    <p>Enable the skill <a href="https://skills-store.amazon.com/deeplink/dp/B07MJ7H85N?deviceType=app&share&refSuffix=ss_copy" target="_blank">here</a> and link your account.</p>
                                    <p>"Alexa, open random student"</p>
                                    <p>"Alexa, ask random student for period 3"</p>
                                    <p>"Alexa, ask random student for 5th hour"</p>
                                </Col>
                            </Row>
                        </Container>
                    </Col>
                </Row>
            </Container>
        );
    }

    componentDidMount() {
        this.ref.onSnapshot(snap => {
            if (!snap.exists) {
                snap.ref.set({
                    joinDate: new Date(),
                    classes: {}
                });
            } else {
                this.setState({user: snap.data()});
            }
        });
        this.tokenRef.onSnapshot(snap => {
            this.setState({tokens: snap.docs.map(t => t.data()).filter(t => t.redirectUri.includes('pitangui.amazon.com'))})
        });
    }
}