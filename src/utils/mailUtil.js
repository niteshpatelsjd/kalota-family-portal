const nodemailer = require("nodemailer");
const axios = require("axios");

const mailPort =
  Number(process.env.MAIL_PORT) || 587;

const mailSecure =
  process.env.MAIL_SECURE
    ? process.env.MAIL_SECURE === "true"
    : mailPort === 465;

const transporter = nodemailer.createTransport({
  host:
    process.env.MAIL_HOST ||
    "smtp.gmail.com",
  port: mailPort,
  secure: mailSecure,
  family:
    Number(process.env.MAIL_FAMILY) ||
    4,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

async function sendMail(to, subject, html) {
  if (process.env.BREVO_API_KEY) {
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ||
      process.env.MAIL_USERNAME;

    const senderName =
      process.env.BREVO_SENDER_NAME ||
      "Kalota Family Community Portal";

    const response =
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: to,
            },
          ],
          subject,
          htmlContent: html,
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
        }
      );

    return response.data;
  }

  return await transporter.sendMail({
    from: process.env.MAIL_USERNAME,
    to,
    subject,
    html,
  });
}

module.exports = {
  sendMail,
};
