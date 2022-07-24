const dotenv = require('dotenv');

dotenv.config();

const {
  PORT,
  HOST,
  HOST_URL,
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  type,
  private_key_id,
  private_key,
  client_email,
  client_id,
  auth_uri,
  token_uri,
  auth_provider_x509_cert_url,
  client_x509_cert_url,
} = process.env;

module.exports = {
  PORT,
  HOST,
  HOST_URL,
  firebaseConfig: {
    apiKey: apiKey,
    authDomain: authDomain,
    databaseURL: databaseURL,
    projectId: projectId,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId,
    appId: appId,
  },
  serviceAccount: {
    type: type,
    project_id: projectId,
    private_key_id: private_key_id,
    private_key: private_key,
    client_email: client_email,
    client_id: client_id,
    auth_uri: auth_uri,
    token_uri: token_uri,
    auth_provider_x509_cert_url: auth_provider_x509_cert_url,
    client_x509_cert_url: client_x509_cert_url,
  },
};
