import React, { Component } from "react";
import app from "./base";

interface ICourseListing {
    [key: string]: Array<string>
}

interface IUserState {
    user: {
        joinDate: Date | null,
        classes: ICourseListing
    }
}

export default class ClassList extends Component {
    state: IUserState = {
        user: {
            joinDate: null,
            classes: {}
        }
    };

    ref: firebase.firestore.DocumentReference

    constructor(props: React.Props<ClassList>) {
        super(props);
        const firestore = app.firestore();
        firestore.settings({
            timestampsInSnapshots: true
        });
        this.ref = firestore.doc(`/users/${app.auth().currentUser!.uid}`);
    }

    render() {
        return (
            <div>
                <h1>My Classes</h1>
                <div>
                    <button onClick={() => {{
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
                    }}}>+ Add a Class</button>
                </div>
                {
                    (this.state.user.classes === null) ?
                        <div>No classes. Go ahead and add one!</div> :
                        <div>
                            {Object.keys(this.state.user.classes).map(c => <div key={c}>
                                {c} <button onClick={() => {
                                    if (confirm(`Really delete class ${c}?`)) {
                                        let classes = Object.assign({}, this.state.user.classes);
                                        delete classes[c];
                                        this.ref.update({classes});
                                    }
                                }}>Delete</button>
                            </div>)}
                        </div>
                }
            </div>
        )
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