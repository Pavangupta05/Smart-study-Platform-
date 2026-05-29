const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || "sandbox_user",
      pass: process.env.SMTP_PASSWORD || "sandbox_pass",
    },
  });

  // Define the email options
  const message = {
    from: `${process.env.FROM_NAME || "Smart Study Platform"} <${process.env.FROM_EMAIL || "noreply@smartstudy.com"}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  // Send the email
  const info = await transporter.sendMail(message);
  console.log(`✉️  Message sent: %s`, info.messageId);
};

module.exports = sendEmail;
