import React, { Component } from 'react';
import app from './base';
import Container from 'reactstrap/lib/Container';
import Alert from 'reactstrap/lib/Alert';
import Row from 'reactstrap/lib/Row';
import Col from 'reactstrap/lib/Col';
import Button from 'reactstrap/lib/Button';
import { Link } from 'react-router-dom';

interface IHomeState {
    user: firebase.User | null
}

export default class Home extends Component {
    state: IHomeState = {
        user: null
    };
    nameList = [
        'Robin',
        'Roger',
        'Rodolfo',
        'Jose',
        'Casey',
        'Jerome',
        'Roderick',
        'Grady',
        'Emmett',
        'Wayne',
        'Jody',
        'Olivia',
        'Angelica',
        'Myra',
        'Fannie',
        'Hope',
        'Andrea',
        'Katrina',
        'Samantha',
        'Teresa'
    ]
    render() {
        return (
            <Container>
                <Row>
                    <Col xs='12'>
                        {
                            (this.state.user !== null) ?
                                <Alert color="success">Logged in as {this.state.user.displayName}</Alert> :
                                <Alert color="secondary">Not logged in - <a href='/login'>Log in with Google</a></Alert>
                        }
                    </Col>
                </Row>
                <Row>
                    <Col xs='12'>
                        <h2>Increase student engagement</h2>
                    </Col>
                </Row>
                <Row>
                    <Col md='4'>
                        <h3>Upload your class list</h3>
                        <p>
                            <a href='/classes'>Manage your class periods here.</a>
                        </p>
                        <p>
                            You can organize by class period.
                        </p>
                    </Col>
                    <Col md='4'>
                        <h3>Connect your device</h3>
                        <p>
                            <a href="https://skills-store.amazon.com/deeplink/dp/B07MJ7H85N?deviceType=app&share&refSuffix=ss_copy">Alexa Skill available now.</a>
                        </p>
                        <p>
                            Google Assistant and Slack integrations coming soon.
                        </p>
                    </Col>
                    <Col md='4'>
                        <h3>"Alexa, open Random Student"</h3>
                        <p>
                            "I think it's {this.nameList[Math.floor(Math.random() * this.nameList.length)]}'s turn to answer."
                        </p>
                    </Col>
                </Row>
                <Row>
                    <Col md='12'>
                        <Button tag={Link} to="/quickstart" color="success" style={{width: '100%'}}>Get Started Quick</Button>
                    </Col>
                </Row>
            </Container>
        );
    }

    componentDidMount() {
      app.auth().onAuthStateChanged(user => {
        this.setState({
            user: user
        });
      });
    }
}