const pool = require('../db');
const { logActivity } = require('../utils/logger');

const getSuppliers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createSupplier = async (req, res) => {
    try {
        const { name, contact_person, email, phone, address, gst_number, payment_terms } = req.body;
        const result = await pool.query(
            `INSERT INTO suppliers (name, contact_person, email, phone, address, gst_number, payment_terms) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, contact_person, email, phone, address, gst_number, payment_terms]
        );
        
        await logActivity(req.user.id, 'Created Supplier', { supplierId: result.rows[0].id, name }, req.ip);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, email, phone, address, gst_number, payment_terms, status } = req.body;
        
        const result = await pool.query(
            `UPDATE suppliers 
             SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, 
                 gst_number = $6, payment_terms = $7, status = $8, updated_at = NOW() 
             WHERE id = $9 RETURNING *`,
            [name, contact_person, email, phone, address, gst_number, payment_terms, status, id]
        );
        
        if (result.rows.length === 0) return res.status(404).send('Supplier not found');
        
        await logActivity(req.user.id, 'Updated Supplier', { supplierId: id, name }, req.ip);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const checkResult = await pool.query('SELECT name FROM suppliers WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) return res.status(404).send('Supplier not found');
        
        await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
        
        await logActivity(req.user.id, 'Deleted Supplier', { supplierId: id, name: checkResult.rows[0].name }, req.ip);
        
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
