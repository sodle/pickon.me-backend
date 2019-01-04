import firebase from 'firebase';

const app = firebase.initializeApp({
    apiKey: "AIzaSyBpxh4y-AnXBXyefFdwIl-M603mwJpqGuA",
    authDomain: "randomstudent-ba994.firebaseapp.com",
    databaseURL: "https://randomstudent-ba994.firebaseio.com",
    projectId: "randomstudent-ba994",
    storageBucket: "randomstudent-ba994.appspot.com",
    messagingSenderId: "837061064935"
});

export default app;