const nodemailer = require("nodemailer");

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
