import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router';
import app from './base';
import Container from 'reactstrap/lib/Container';
import Row from 'reactstrap/lib/Row';
import Col from 'reactstrap/lib/Col';
import Button from 'reactstrap/lib/Button';

interface ICourseListing {
    [key: string]: Array<string>
}

interface IUserState {
    user: {
        joinDate: Date | null,
        classes: ICourseListing
    }
}

interface IMatchProps {
    id: string
}

export default class Roster extends Component<RouteComponentProps<IMatchProps>> {
    state: IUserState = {
        user: {
            joinDate: null,
            classes: {}
        }
    }

    ref: firebase.firestore.DocumentReference
    
    constructor(props: RouteComponentProps<IMatchProps>) {
        super(props);
        const firestore = app.firestore();
        firestore.settings({
            timestampsInSnapshots: true
        });
        this.ref = firestore.doc(`/users/${app.auth().currentUser!.uid}`);
    }

    render() {
        const rosterId = this.props.match.params.id;
        if (this.state.user.classes.hasOwnProperty(rosterId)) {
            return (
                <Container>
                    <Row>
                        <Col xs='12'>
                            <h1>Class Roster: {rosterId}</h1>
                        </Col>
                    </Row>
                    <Row>
                        <Col md='6'>
                            <Button color='primary' onClick={() => {
                                let classes = Object.assign({}, this.state.user.classes);
                                let name = '';
                                while (name === '') {
                                    let newName = prompt('Student name?');
                                    if (newName === null) {
                                        return;
                                    } else {
                                        name = newName;
                                    }
                                }
                                classes[rosterId].push(name);
                                this.ref.update({classes});
                            }}>+ Add a Student</Button>
                        </Col>
                        <Col md='6'>
                            <Button color='secondary' onClick={() => {
                                if (this.state.user.classes[rosterId].length === 0) {
                                    alert('You must add a student first.');
                                } else {
                                    let students = this.state.user.classes[rosterId];
                                    alert(students[Math.floor(Math.random() * students.length)]);
                                }
                            }}>Pick Randomly</Button>
                        </Col>
                    </Row>
                    <Row>
                        {
                            (this.state.user.classes[rosterId].length > 0) ?
                                <Col xs='12'>
                                    {this.state.user.classes[rosterId].sort().map((s, i) => {
                                        return <Row key={i}>
                                            <Col xs='6'>
                                                <h2>{s}</h2>
                                            </Col>
                                            <Col xs='6'>
                                                <Button color='danger' onClick={() => {
                                                    if (confirm(`Really delete ${s}?`)) {
                                                        let classes = Object.assign({}, this.state.user.classes);
                                                        classes[rosterId].splice(i, 1);
                                                        this.ref.update({classes});
                                                    }
                                                }}>Delete</Button>
                                            </Col>
                                        </Row>;
                                    })}
                                </Col> :
                                <Col xs='12'>No students yet. Add one!</Col>
                        }
                    </Row>
                </Container>
            );
        } else {
            return <div>Class {rosterId} not found!</div>;
        }
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
    }
}