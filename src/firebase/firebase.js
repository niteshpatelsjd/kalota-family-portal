const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = require("./kalota-family-portal-firebase-adminsdk-fbsvc-a3ae5c582b.json");

let app;

if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApps()[0];
}

const messaging = getMessaging(app);

module.exports = {
  app,
  messaging,
};