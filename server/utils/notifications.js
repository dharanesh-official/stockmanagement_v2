const pool = require('../db');

/**
 * Sends a notification to a specific user or all admins
 * @param {string} userId - UUID of the user (null for all admins)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Type of notification
 */
const sendNotification = async (userId, title, message, type = 'info') => {
    try {
        if (userId) {
            await pool.query(
                'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
                [userId, title, message, type]
            );
        } else {
            // Send to all admins
            const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of admins.rows) {
                await pool.query(
                    'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
                    [admin.id, title, message, type]
                );
            }
        }
    } catch (err) {
        console.error('Failed to send notification:', err.message);
    }
};

module.exports = { sendNotification };
