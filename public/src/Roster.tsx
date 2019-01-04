import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router';
import app from './base';

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
                <div>
                    <h1>Class Roster: {rosterId}</h1>
                    <button onClick={() => {
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
                    }}>+ Add a Student</button>
                    <button onClick={() => {
                        if (this.state.user.classes[rosterId].length === 0) {
                            alert('You must add a student first.');
                        } else {
                            let students = this.state.user.classes[rosterId];
                            alert(students[Math.floor(Math.random() * students.length)]);
                        }
                    }}>Pick Randomly</button>
                    {
                        (this.state.user.classes[rosterId].length > 0) ?
                            <div>
                                {this.state.user.classes[rosterId].sort().map((s, i) => {
                                    return <div key={i}>
                                        {s} <button onClick={() => {
                                            if (confirm(`Really delete ${s}?`)) {
                                                let classes = Object.assign({}, this.state.user.classes);
                                                classes[rosterId].splice(i, 1);
                                                this.ref.update({classes});
                                            }
                                        }}>Delete</button>
                                    </div>;
                                })}
                            </div> :
                            <div>No students yet. Add one!</div>
                    }
                </div>
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