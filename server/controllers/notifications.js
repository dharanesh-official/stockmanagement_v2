const pool = require('../db');

const getNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM notifications WHERE user_id = $1',
            [req.user.id]
        );
        res.json({ message: 'All notifications cleared successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


module.exports = { getNotifications, markAsRead, markAllAsRead };
