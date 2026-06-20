const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const {
  getMessaging,
} = require("firebase-admin/messaging");

let app;

if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId:
        process.env.FIREBASE_PROJECT_ID,

      clientEmail:
        process.env.FIREBASE_CLIENT_EMAIL,

      privateKey:
        process.env.FIREBASE_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
    }),
  });
} else {
  app = getApps()[0];
}

const messaging = getMessaging(app);

module.exports = {
  app,
  messaging,
};