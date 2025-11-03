const express = require('express');
const router = express.Router();
const vicidialApi = require('../services/vicidialApi');

/**
 * GET /api/lists/:list_id
 * Get information about a specific list
 */
router.get('/:list_id', async (req, res) => {
  try {
    const { list_id } = req.params;
    const { leads_counts, dialable_count } = req.query;

    const result = await vicidialApi.getListInfo({
      list_id,
      leads_counts: leads_counts || 'Y',
      dialable_count: dialable_count || 'Y',
    });

    if (result.success) {
      const parsed = vicidialApi.parseResponse(result.data);
      res.json({
        success: true,
        data: parsed[0] || {},
        raw: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || result.data,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/lists
 * Create a new list
 */
router.post('/', async (req, res) => {
  try {
    const {
      list_id,
      list_name,
      campaign_id,
      active,
      list_description,
      outbound_cid,
      script,
      web_form_address,
      ...otherOptions
    } = req.body;

    // Validación básica
    if (!list_id || !list_name || !campaign_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: list_id, list_name, campaign_id',
      });
    }

    const result = await vicidialApi.addList({
      list_id,
      list_name,
      campaign_id,
      active: active || 'Y',
      list_description,
      outbound_cid,
      script,
      web_form_address,
      ...otherOptions,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'List created successfully',
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.data,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/lists/:list_id
 * Update an existing list
 */
router.put('/:list_id', async (req, res) => {
  try {
    const { list_id } = req.params;
    const { reset_list, delete_list, delete_leads, ...options } = req.body;

    const result = await vicidialApi.updateList({
      list_id,
      reset_list,
      delete_list,
      delete_leads,
      ...options,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'List updated successfully',
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.data,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/lists/:list_id
 * Delete a list
 */
router.delete('/:list_id', async (req, res) => {
  try {
    const { list_id } = req.params;
    const { delete_leads } = req.query;

    const result = await vicidialApi.updateList({
      list_id,
      delete_list: 'Y',
      delete_leads: delete_leads === 'true' ? 'Y' : 'N',
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'List deleted successfully',
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.data,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
