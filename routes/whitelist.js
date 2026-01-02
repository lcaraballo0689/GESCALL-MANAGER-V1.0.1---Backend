const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

/**
 * GET /api/whitelist
 * List whitelist prefixes with pagination
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        const result = await databaseService.getWhitelistPrefixes(limit, offset, search);

        res.json({
            success: true,
            data: result.data,
            pagination: {
                total: result.total,
                page,
                limit,
                pages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        console.error('[Whitelist List] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/whitelist
 * Add a new prefix to whitelist
 */
router.post('/', async (req, res) => {
    try {
        const { prefix, description } = req.body;

        if (!prefix) {
            return res.status(400).json({
                success: false,
                error: 'Prefix is required'
            });
        }

        // Validate prefix format (3 digits)
        const cleanPrefix = prefix.replace(/[^0-9]/g, '');
        if (cleanPrefix.length !== 3) {
            return res.status(400).json({
                success: false,
                error: 'Prefix must be exactly 3 digits'
            });
        }

        const result = await databaseService.addWhitelistPrefix(cleanPrefix, description || '');

        res.json({
            success: true,
            message: 'Prefix added to whitelist',
            data: { id: result.id, prefix: cleanPrefix }
        });
    } catch (error) {
        console.error('[Whitelist Add] Error:', error);

        // Handle duplicate entry
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Este prefijo ya existe en la lista blanca'
            });
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/whitelist/:id
 * Update a whitelist prefix
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { prefix, description, is_active } = req.body;

        const updateData = {};
        if (prefix !== undefined) {
            const cleanPrefix = prefix.replace(/[^0-9]/g, '');
            if (cleanPrefix.length !== 3) {
                return res.status(400).json({
                    success: false,
                    error: 'Prefix must be exactly 3 digits'
                });
            }
            updateData.prefix = cleanPrefix;
        }
        if (description !== undefined) updateData.description = description;
        if (is_active !== undefined) updateData.is_active = is_active;

        await databaseService.updateWhitelistPrefix(id, updateData);

        res.json({
            success: true,
            message: 'Prefix updated'
        });
    } catch (error) {
        console.error('[Whitelist Update] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/whitelist/:id
 * Delete a prefix from whitelist
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID is required'
            });
        }

        await databaseService.deleteWhitelistPrefix(id);

        res.json({
            success: true,
            message: 'Prefix removed from whitelist'
        });
    } catch (error) {
        console.error('[Whitelist Delete] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/whitelist/validate/:phone
 * Validate if a phone number is in whitelist
 */
router.get('/validate/:phone', async (req, res) => {
    try {
        const { phone } = req.params;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const result = await databaseService.validateWhitelistNumber(cleanPhone);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('[Whitelist Validate] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/whitelist/apply
 * Apply whitelist filter to all leads in hopper
 * Removes leads that don't match any active whitelist prefix
 */
router.post('/apply', async (req, res) => {
    try {
        const result = await databaseService.applyWhitelistFilter();

        res.json({
            success: true,
            message: 'Whitelist filter applied',
            data: result
        });
    } catch (error) {
        console.error('[Whitelist Apply] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/whitelist/clear-filter
 * Remove whitelist filter - restore all WLFLTR leads to NEW status
 */
router.post('/clear-filter', async (req, res) => {
    try {
        const result = await databaseService.clearWhitelistFilter();

        res.json({
            success: true,
            message: 'Whitelist filter cleared',
            data: result
        });
    } catch (error) {
        console.error('[Whitelist Clear Filter] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
