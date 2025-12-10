const express = require('express');
const router = express.Router();
const vicidialApi = require('../services/vicidialApi');
const databaseService = require('../services/databaseService');

/**
 * GET /api/campaigns
 * Get all campaigns or a specific campaign (using direct DB)
 */
router.get('/', async (req, res) => {
  try {
    const { campaign_id } = req.query;

    let data;
    if (campaign_id) {
      data = await databaseService.getCampaignById(campaign_id);
      data = data ? [data] : [];
    } else {
      data = await databaseService.getAllCampaigns();
    }

    console.log('[Campaigns] ========================================');
    console.log('[Campaigns] Campaigns requested');
    console.log('[Campaigns] Total campaigns returned:', data.length);
    if (data.length > 0) {
      console.log('[Campaigns] Campaign IDs:', data.map(c => c.campaign_id).join(', '));
      console.log('[Campaigns] First campaign structure:', JSON.stringify(data[0], null, 2));
    }
    console.log('[Campaigns] ========================================');

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaigns] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/campaigns/:campaign_id/hopper
 * Get hopper list for a campaign (still uses Vicidial API)
 */
router.get('/:campaign_id/hopper', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const result = await vicidialApi.getHopperList({
      campaign_id,
    });

    if (result.success) {
      const parsed = vicidialApi.parseResponse(result.data);
      res.json({
        success: true,
        data: parsed,
        raw: result.data,
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
 * GET /api/campaigns/:campaign_id/lists
 * Get all lists for a campaign (using direct DB)
 */
router.get('/:campaign_id/lists', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const data = await databaseService.getListsByCampaign(campaign_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Lists] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/campaigns/:campaign_id/progress
 * Get campaign progress (Vicibroker compatible)
 * Body: { limit: 1000 } (optional)
 */
router.post('/:campaign_id/progress', async (req, res) => {
  try {
    const { campaign_id } = req.params;
    const { limit } = req.body;

    const data = await databaseService.getProgressForSingleCampaign(
      campaign_id,
      limit
    );

    console.log(`[Campaign Progress] Campaign: ${campaign_id}, Data:`, data);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Progress] Error:', error);
    res.json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/campaigns/bulk/lists-count
 * Get lists count for multiple campaigns (using direct DB)
 * Body: { campaigns: ['CAMP01', 'CAMP02'] }
 */
router.post('/bulk/lists-count', async (req, res) => {
  try {
    const { campaigns } = req.body;

    if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'campaigns array is required and cannot be empty',
      });
    }

    const data = await databaseService.getListsCountByCampaign(campaigns);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaigns Bulk Lists Count] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/campaigns/:campaign_id/stats
 * Get campaign statistics and progress overview
 */
router.get('/:campaign_id/stats', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const data = await databaseService.getCampaignStats(campaign_id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Stats] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/campaigns/:campaign_id/progress-status
 * Get campaign progress by status (detailed breakdown)
 */
router.get('/:campaign_id/progress-status', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const data = await databaseService.getCampaignProgressByStatus(campaign_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Progress by Status] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/campaigns/:campaign_id/lists-progress
 * Get campaign progress by list with detailed stats
 */
router.get('/:campaign_id/lists-progress', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const data = await databaseService.getCampaignListsProgress(campaign_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Lists Progress] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/campaigns/:campaign_id/call-activity
 * Get campaign call activity (today)
 */
router.get('/:campaign_id/call-activity', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const data = await databaseService.getCampaignCallActivity(campaign_id);

    res.json({
      success: true,
      data: data || {
        total_calls: 0,
        sales: 0,
        transfers: 0,
        drops: 0,
        no_answer: 0,
        busy: 0,
        total_talk_time: 0,
        avg_talk_time: 0,
        active_agents: 0
      },
    });
  } catch (error) {
    console.error('[Campaign Call Activity] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/campaigns/:campaign_id/hourly-activity
 * Get campaign hourly activity (today)
 */
router.get('/:campaign_id/hourly-activity', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const data = await databaseService.getCampaignHourlyActivity(campaign_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Hourly Activity] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/campaigns/:campaign_id/agents-performance
 * Get campaign agents performance (today)
 */
router.get('/:campaign_id/agents-performance', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const data = await databaseService.getCampaignAgentsPerformance(campaign_id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Agents Performance] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/campaigns/:campaign_id/dial-log
 * Get campaign dial log by date range
 * Body: { startDatetime: '2025-10-25 00:00:00', endDatetime: '2025-10-25 23:59:59', limit: 500000 }
 */
router.post('/:campaign_id/dial-log', async (req, res) => {
  try {
    const { campaign_id } = req.params;
    const { startDatetime, endDatetime, limit } = req.body;

    if (!startDatetime || !endDatetime) {
      return res.status(400).json({
        success: false,
        error: 'startDatetime and endDatetime are required (format: YYYY-MM-DD HH:MM:SS)',
      });
    }

    const data = await databaseService.getDialLogByCampaignDateRange(
      [campaign_id],
      startDatetime,
      endDatetime,
      limit || 500000
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaign Dial Log] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/campaigns/summary
 * Get campaigns summary with metrics
 * Body: { campaigns: ['CAMP01', 'CAMP02'] } (optional - if not provided, returns all campaigns)
 */
router.post('/summary', async (req, res) => {
  try {
    const { campaigns } = req.body;

    const data = await databaseService.getCampaignsSummary(campaigns);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Campaigns Summary] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
