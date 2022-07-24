const firebase = require('firebase');
const { firebaseConfig } = require('../config');

const config = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

const db = firebase.initializeApp(config);

const firestore = db.firestore();
const auth = db.auth();

module.exports = { firestore, auth };
