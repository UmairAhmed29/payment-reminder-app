const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendDailyReminders = functions.pubsub.schedule("every 24 hours")
    .onRun(async (context) => {
      const db = admin.firestore();
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

      const snapshot = await db.collection("payments")
          .where("isPaid", "==", false)
          .where("dueDate", "<=", today)
          .where("deleted", "==", false)
          .get();

      const messages = [];

      snapshot.forEach((doc) => {
        const payment = doc.data();
        if (payment.fcmToken) {
          messages.push({
            notification: {
              title: "Payment Reminder",
              body: `Reminder: Your payment "${payment.title}" is due. ` +
                `Please make the payment.`,
            },
            token: payment.fcmToken,
          });
        }
      });

      if (messages.length > 0) {
        await admin.messaging().sendAll(messages);
      }

      return null;
    });
