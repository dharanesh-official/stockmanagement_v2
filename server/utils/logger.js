const pool = require('../db');

/**
 * Logs an activity to the database
 * @param {string} userId - UUID of the user performing the action
 * @param {string} action - Description of the action (e.g., 'Created Order')
 * @param {object} details - JSON object with more info (e.g., { orderId: '...' })
 * @param {string} ipAddress - IP address of the client
 */
const logActivity = async (userId, action, details = {}, ipAddress = '0.0.0.0') => {
    try {
        if (!userId) return;
        await pool.query(
            'INSERT INTO activity_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [userId, action, JSON.stringify(details), ipAddress]
        );
    } catch (err) {
        console.error('Failed to log activity:', err.message);
    }
};

module.exports = { logActivity };
