const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'destek.m9@gmail.com',
    pass: 'ajxfkmwuyqaooaku'
  }
});

function sendErrorMail(subject, message) {
  const mailOptions = {
    from: '"Tikleap Bot" <destek.m9@gmail.com>',
    to: 'destek.m9@gmail.com',
    subject,
    text: message
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendErrorMail;