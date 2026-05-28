const Notification = require("../models/Notification");

/**
 * Creates a notification in the database and emits it in real-time to the target user.
 * 
 * @param {Object} io - The Socket.IO instance (req.app.get('io'))
 * @param {String} userId - The MongoDB ObjectId of the user receiving the notification
 * @param {String} title - The title of the notification
 * @param {String} message - The body text
 * @param {String} type - The notification type ('info', 'success', 'warning', 'error', 'ai', 'streak')
 * @param {String} link - (Optional) URL to navigate to when clicked
 */
const sendNotification = async (io, userId, title, message, type = "info", link = null) => {
  try {
    // 1. Save to the Database so it persists
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      link
    });

    // 2. Emit live via Socket.IO to the specific user's room
    if (io) {
      io.to(userId.toString()).emit("notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
};

module.exports = sendNotification;
