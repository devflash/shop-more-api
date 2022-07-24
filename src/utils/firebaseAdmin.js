// import * as firebaseAdmin from 'firebase-admin';
// import serviceAccount from '../secret.json';
const firebaseAdmin = require('firebase-admin');
const { serviceAccount } = require('../config');

const { private_key } = JSON.parse(serviceAccount.private_key);

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      privateKey: private_key,
      clientEmail: serviceAccount.client_email,
      projectId: serviceAccount.project_id,
    }),
    databaseURL: 'https://shopmore-551c5-default-rtdb.firebaseio.com',
  });
}

module.exports = { firebaseAdmin };
