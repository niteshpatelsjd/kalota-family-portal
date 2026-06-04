const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
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