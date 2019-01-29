import React, { Component, createRef } from "react";
import app from "./base";
import Container from "reactstrap/lib/Container";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import Button from "reactstrap/lib/Button";
import Helmet from "react-helmet";
import 'firebase/firestore';

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
    private topRef = createRef<HTMLDivElement>()

    constructor(props: React.Props<ClassList>) {
        super(props);
        const firestore = app.firestore();
        firestore.settings({
            timestampsInSnapshots: true
        });
        this.ref = firestore.doc(`/users/${app.auth().currentUser!.uid}`);
    }

    render() {
        return <>
            <Container>
                <div ref={this.topRef} />
                <Helmet>
                    <title>My Classes - PickOn.Me</title>
                </Helmet>
                <Row>
                    <Col md='6'>
                        <h1>My Classes</h1>
                        <p>
                            Here, you can add your different class periods. Each class period can be denoted by a single number or letter.
                        </p>
                    </Col>
                </Row>
                <Row>
                    <Col md='6'>
                        <Button color='primary' onClick={() => {{
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
                        }}}>+ Add a Class</Button>
                    </Col>
                </Row>
                <Row>
                    {
                        (this.state.user.classes === null) ?
                            <Col md='12'>No classes. Go ahead and add one!</Col> :
                            <Col md='12'>
                                {Object.keys(this.state.user.classes).map(c => <Row key={c}>
                                    <Col xs='6'>
                                        <h3><a href={`/classes/${c}`}>{c}</a></h3>
                                    </Col>
                                    <Col xs='6'>
                                        <Button color='danger' onClick={() => {
                                            if (confirm(`Really delete class ${c}?`)) {
                                                let classes = Object.assign({}, this.state.user.classes);
                                                delete classes[c];
                                                this.ref.update({classes});
                                            }
                                        }}>Delete</Button>
                                    </Col>
                                </Row>)}
                            </Col>
                    }
                </Row>
            </Container>
        </>;
    }

    componentDidMount() {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.type = 'text/javascript';
        gaScript.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        this.topRef.current!.appendChild(gaScript);

        const gaLoader = document.createElement('script');
        gaLoader.type = 'text/javascript';
        gaLoader.innerHTML = `(adsbygoogle = window.adsbygoogle || []).push({google_ad_client: "ca-pub-1307035032074289", enable_page_level_ads: true});`;
        this.topRef.current!.appendChild(gaLoader);

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