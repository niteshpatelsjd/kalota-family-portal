const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
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
