const database = require('../config/database');

class DatabaseService {
  /**
   * Get dial log by campaign and date range (Vicibroker query)
   * @param {string[]} campaigns - Array of campaign IDs
   * @param {string} startDatetime - Start datetime (YYYY-MM-DD HH:MM:SS)
   * @param {string} endDatetime - End datetime (YYYY-MM-DD HH:MM:SS)
   * @param {number} limit - Max rows to return
   * @returns {Promise<Array>}
   */
  async getDialLogByCampaignDateRange(campaigns, startDatetime, endDatetime, limit = 500000) {
    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    const placeholders = campaigns.map(() => '?').join(',');
    const sql = `
      SELECT
          vdl.call_date,
          vl.phone_number,
          vl.status,
          vl.list_id,
          vls.list_name,
          vls.list_description,
          vls.campaign_id
      FROM vicidial_dial_log vdl
      LEFT JOIN vicidial_list vl ON vdl.lead_id = vl.lead_id
      LEFT JOIN vicidial_lists vls ON vl.list_id = vls.list_id
      WHERE vdl.call_date BETWEEN ? AND ?
        AND vls.campaign_id IN (${placeholders})
      ORDER BY vdl.call_date ASC
      LIMIT ?
    `;

    const params = [startDatetime, endDatetime, ...campaigns, limit];
    return await database.query(sql, params);
  }

  /**
   * Get status summary by list (Vicibroker query)
   * @param {string[]} campaigns - Array of campaign IDs
   * @param {string} startDatetime - Start datetime (YYYY-MM-DD HH:MM:SS)
   * @param {string} endDatetime - End datetime (YYYY-MM-DD HH:MM:SS)
   * @param {number} limit - Max rows to return
   * @returns {Promise<Array>}
   */
  async getStatusSummaryByList(campaigns, startDatetime, endDatetime, limit = 10000) {
    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    const placeholders = campaigns.map(() => '?').join(',');
    const sql = `
      SELECT
          vls.campaign_id,
          vl.list_id,
          vls.list_name,
          vl.status,
          COUNT(*) as total
      FROM vicidial_dial_log vdl
      INNER JOIN vicidial_list vl ON vdl.lead_id = vl.lead_id
      INNER JOIN vicidial_lists vls ON vl.list_id = vls.list_id
      WHERE vdl.call_date BETWEEN ? AND ?
        AND vls.campaign_id IN (${placeholders})
      GROUP BY vls.campaign_id, vl.list_id, vls.list_name, vl.status
      ORDER BY vls.campaign_id, vl.list_id, vl.status
      LIMIT ?
    `;

    const params = [startDatetime, endDatetime, ...campaigns, limit];
    return await database.query(sql, params);
  }

  /**
   * Get campaign progress by list (Vicibroker query)
   * @param {string[]} campaigns - Array of campaign IDs
   * @param {string} startDatetime - Start datetime (YYYY-MM-DD HH:MM:SS)
   * @param {string} endDatetime - End datetime (YYYY-MM-DD HH:MM:SS)
   * @param {number} limit - Max rows to return
   * @returns {Promise<Array>}
   */
  async getCampaignProgressByList(campaigns, startDatetime, endDatetime, limit = 10000) {
    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    const placeholders = campaigns.map(() => '?').join(',');
    const sql = `
      SELECT
          vls.campaign_id,
          vl.list_id,
          vls.list_name,
          SUM(CASE WHEN vl.status = 'AA' THEN 1 ELSE 0 END) as AA,
          SUM(CASE WHEN vl.status = 'NA' THEN 1 ELSE 0 END) as NA,
          SUM(CASE WHEN vl.status = 'NEW' THEN 1 ELSE 0 END) as NEW,
          SUM(CASE WHEN vl.status = 'PDROP' THEN 1 ELSE 0 END) as PDROP,
          SUM(CASE WHEN vl.status = 'PM' THEN 1 ELSE 0 END) as PM,
          SUM(CASE WHEN vl.status = 'PU' THEN 1 ELSE 0 END) as PU,
          SUM(CASE WHEN vl.status = 'SVYEXT' THEN 1 ELSE 0 END) as SVYEXT,
          COUNT(*) as TOTAL
      FROM vicidial_dial_log vdl
      INNER JOIN vicidial_list vl ON vdl.lead_id = vl.lead_id
      INNER JOIN vicidial_lists vls ON vl.list_id = vls.list_id
      WHERE vdl.call_date BETWEEN ? AND ?
        AND vls.campaign_id IN (${placeholders})
      GROUP BY vls.campaign_id, vl.list_id, vls.list_name
      ORDER BY vls.campaign_id, vl.list_id
      LIMIT ?
    `;

    const params = [startDatetime, endDatetime, ...campaigns, limit];
    return await database.query(sql, params);
  }

  /**
   * Get campaigns status (Vicibroker query)
   * @param {string[]} campaigns - Array of campaign IDs
   * @param {number} limit - Max rows to return
   * @returns {Promise<Array>}
   */
  async getCampaignsStatus(campaigns, limit = 1000) {
    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    const placeholders = campaigns.map(() => '?').join(',');
    const sql = `
      SELECT
          campaign_id,
          campaign_name,
          CASE
              WHEN active = 'Y' THEN 'Activa'
              WHEN active = 'N' THEN 'Inactiva'
              ELSE 'Pausada'
          END as estado
      FROM vicidial_campaigns
      WHERE campaign_id IN (${placeholders})
      ORDER BY campaign_name
      LIMIT ?
    `;

    const params = [...campaigns, limit];
    return await database.query(sql, params);
  }

  /**
   * Get lists count by campaign (Vicibroker query)
   * @param {string[]} campaigns - Array of campaign IDs
   * @param {number} limit - Max rows to return
   * @returns {Promise<Array>}
   */
  async getListsCountByCampaign(campaigns, limit = 1000) {
    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    const placeholders = campaigns.map(() => '?').join(',');
    const sql = `
      SELECT
          campaign_id,
          COUNT(*) as cantidad_listas
      FROM vicidial_lists
      WHERE campaign_id IN (${placeholders})
      GROUP BY campaign_id
      LIMIT ?
    `;

    const params = [...campaigns, limit];
    return await database.query(sql, params);
  }

  /**
   * Get progress for a single campaign (Vicibroker query)
   * @param {string} campaign - Campaign ID (scalar, not array)
   * @param {number} limit - Max rows to return
   * @returns {Promise<Object>}
   */
  async getProgressForSingleCampaign(campaign, limit = 1000) {
    const sql = `
      SELECT
          vls.campaign_id,
          COUNT(*) as total,
          CAST(SUM(CASE WHEN vl.called_count > 0 THEN 1 ELSE 0 END) AS UNSIGNED) as avance,
          ROUND((SUM(CASE WHEN vl.called_count > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as porcentaje
      FROM vicidial_list vl
      INNER JOIN vicidial_lists vls ON vl.list_id = vls.list_id
      WHERE vls.campaign_id = ? AND vls.active = 'Y'
      GROUP BY vls.campaign_id
      LIMIT ?
    `;

    const results = await database.query(sql, [campaign, limit]);
    return results[0] || null;
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>}
   */
  async getDashboardStats() {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM vicidial_live_agents WHERE status != 'LOGOUT') as active_agents,
        (SELECT COUNT(*) FROM vicidial_auto_calls WHERE status = 'LIVE') as active_calls,
        (SELECT COUNT(DISTINCT campaign_id) FROM vicidial_campaigns WHERE active = 'Y') as active_campaigns,
        (SELECT COUNT(*)
         FROM vicidial_list vl
         INNER JOIN vicidial_lists vls ON vl.list_id = vls.list_id
         WHERE vls.active = 'Y' AND (vl.called_count = 0 OR vl.called_count IS NULL)
        ) as pending_leads,
        (SELECT COUNT(*) FROM vicidial_log WHERE call_date >= CURDATE()) as calls_today,
        (SELECT COUNT(*) FROM vicidial_log WHERE status = 'SALE' AND call_date >= CURDATE()) as sales_today,
        (SELECT AVG(length_in_sec) FROM vicidial_log WHERE call_date >= CURDATE() AND length_in_sec > 0) as avg_talk_time_today,
        (SELECT COUNT(*)
         FROM vicidial_list vl
         INNER JOIN vicidial_lists vls ON vl.list_id = vls.list_id
         WHERE vls.active = 'Y'
        ) as total_leads_active_lists
    `;

    const results = await database.query(sql);
    const stats = results[0] || {};

    // Calculate conversion rate
    stats.conversion_rate = stats.calls_today > 0
      ? ((stats.sales_today / stats.calls_today) * 100).toFixed(2)
      : 0;

    // Calculate calls per agent
    stats.calls_per_agent = stats.active_agents > 0
      ? Math.round(stats.calls_today / stats.active_agents)
      : 0;

    return stats;
  }

  /**
   * Get active agents with their current status
   * @returns {Promise<Array>}
   */
  async getActiveAgents() {
    const sql = `
      SELECT
        vla.user,
        vla.conf_exten,
        vla.status,
        vla.server_ip,
        vla.campaign_id,
        vla.extension,
        vla.callerid,
        vla.uniqueid,
        vla.channel,
        vla.call_server_ip,
        vla.last_call_time,
        vla.last_state_change,
        vla.lead_id,
        vla.comments,
        vla.calls_today,
        vla.pause_code,
        vu.full_name,
        vu.user_level,
        vu.user_group
      FROM vicidial_live_agents vla
      LEFT JOIN vicidial_users vu ON vla.user = vu.user
      WHERE vla.status != 'LOGOUT'
      ORDER BY vla.last_state_change DESC
    `;

    return await database.query(sql);
  }

  /**
   * Get all campaigns with detailed info
   * @returns {Promise<Array>}
   */
  async getAllCampaigns() {
    const sql = `
      SELECT
        campaign_id,
        campaign_name,
        campaign_description,
        active,
        dial_method,
        auto_dial_level,
        dial_timeout,
        dial_prefix,
        campaign_cid,
        park_ext,
        park_file_name,
        web_form_address,
        allow_closers,
        hopper_level,
        auto_alt_dial,
        use_internal_dnc,
        use_campaign_dnc,
        lead_order,
        lead_filter_id
      FROM vicidial_campaigns
      ORDER BY campaign_id
    `;

    return await database.query(sql);
  }

  /**
   * Get campaign by ID
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object|null>}
   */
  async getCampaignById(campaignId) {
    const sql = `
      SELECT
        campaign_id,
        campaign_name,
        campaign_description,
        active,
        dial_method,
        auto_dial_level,
        dial_timeout,
        dial_prefix,
        campaign_cid,
        park_ext,
        park_file_name,
        web_form_address,
        allow_closers,
        hopper_level,
        auto_alt_dial,
        use_internal_dnc,
        use_campaign_dnc,
        lead_order,
        lead_filter_id,
        dial_status_a,
        dial_status_b,
        dial_status_c,
        dial_status_d,
        dial_status_e
      FROM vicidial_campaigns
      WHERE campaign_id = ?
    `;

    const results = await database.query(sql, [campaignId]);
    return results[0] || null;
  }

  /**
   * Get all lists
   * @returns {Promise<Array>}
   */
  async getAllLists() {
    const sql = `
      SELECT
        list_id,
        list_name,
        campaign_id,
        active,
        list_description,
        list_changedate,
        list_lastcalldate,
        reset_time,
        expiration_date,
        web_form_address,
        web_form_address_two
      FROM vicidial_lists
      ORDER BY list_id DESC
    `;

    return await database.query(sql);
  }

  /**
   * Get the next available list ID (max + 1)
   * @returns {Promise<number>}
   */
  async getNextListId() {
    const sql = `
      SELECT COALESCE(MAX(list_id), 0) + 1 as next_id
      FROM vicidial_lists
    `;

    const results = await database.query(sql);
    return results[0]?.next_id || 1;
  }

  /**
   * Get lists by campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>}
   */
  async getListsByCampaign(campaignId) {
    const sql = `
      SELECT
        vls.list_id,
        vls.list_name,
        vls.campaign_id,
        vls.active,
        vls.list_description,
        vls.list_changedate,
        vls.list_lastcalldate,
        vls.reset_time,
        vls.expiration_date,
        COUNT(DISTINCT vl.lead_id) as total_leads,
        SUM(CASE WHEN vl.called_count = 0 OR vl.called_count IS NULL THEN 1 ELSE 0 END) as leads_new,
        SUM(CASE WHEN vl.called_count > 0 THEN 1 ELSE 0 END) as leads_contacted,
        SUM(CASE WHEN vl.status = 'DNC' THEN 1 ELSE 0 END) as leads_dnc
      FROM vicidial_lists vls
      LEFT JOIN vicidial_list vl ON vls.list_id = vl.list_id
      WHERE vls.campaign_id = ?
      GROUP BY vls.list_id, vls.list_name, vls.campaign_id, vls.active,
               vls.list_description, vls.list_changedate, vls.list_lastcalldate,
               vls.reset_time, vls.expiration_date
      ORDER BY vls.list_id DESC
    `;

    return await database.query(sql, [campaignId]);
  }

  /**
   * Get campaign statistics and progress overview
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>}
   */
  async getCampaignStats(campaignId) {
    const sql = `
      SELECT
        vc.campaign_id,
        vc.campaign_name,
        vc.active,
        COUNT(DISTINCT vl.lead_id) as total_leads,
        SUM(CASE WHEN vl.status = 'NEW' THEN 1 ELSE 0 END) as leads_new,
        SUM(CASE WHEN vl.status IN ('PU', 'PM', 'SVYEXT', 'SALE', 'DNC', 'NI', 'DC', 'ADC', 'SVYHU', 'SVYVM') THEN 1 ELSE 0 END) as leads_processed,
        SUM(CASE WHEN vl.status = 'AA' THEN 1 ELSE 0 END) as leads_answered,
        SUM(CASE WHEN vl.status = 'NA' THEN 1 ELSE 0 END) as leads_no_answer,
        SUM(CASE WHEN vl.status = 'PDROP' THEN 1 ELSE 0 END) as leads_drop,
        COUNT(DISTINCT vls.list_id) as total_lists
      FROM vicidial_campaigns vc
      LEFT JOIN vicidial_lists vls ON vc.campaign_id = vls.campaign_id
      LEFT JOIN vicidial_list vl ON vls.list_id = vl.list_id
      WHERE vc.campaign_id = ?
      GROUP BY vc.campaign_id, vc.campaign_name, vc.active
    `;

    const results = await database.query(sql, [campaignId]);
    return results[0] || null;
  }

  /**
   * Get campaign progress by status (detailed breakdown)
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>}
   */
  async getCampaignProgressByStatus(campaignId) {
    const sql = `
      SELECT
        vl.status,
        vss.status_name,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
      FROM vicidial_list vl
      INNER JOIN vicidial_lists vls ON vl.list_id = vls.list_id
      LEFT JOIN vicidial_statuses vss ON vl.status = vss.status
      WHERE vls.campaign_id = ?
      GROUP BY vl.status, vss.status_name
      ORDER BY count DESC
    `;

    return await database.query(sql, [campaignId]);
  }

  /**
   * Get campaign progress by list with detailed stats
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>}
   */
  async getCampaignListsProgress(campaignId) {
    const sql = `
      SELECT
        vls.list_id,
        vls.list_name,
        vls.active,
        COUNT(vl.lead_id) as total_leads,
        SUM(CASE WHEN vl.status = 'NEW' THEN 1 ELSE 0 END) as leads_new,
        SUM(CASE WHEN vl.status IN ('PU', 'PM', 'SVYEXT', 'SALE', 'DNC', 'NI', 'DC', 'ADC', 'SVYHU', 'SVYVM') THEN 1 ELSE 0 END) as leads_processed,
        SUM(CASE WHEN vl.status = 'AA' THEN 1 ELSE 0 END) as leads_answered,
        SUM(CASE WHEN vl.status = 'NA' THEN 1 ELSE 0 END) as leads_no_answer,
        SUM(CASE WHEN vl.status = 'PDROP' THEN 1 ELSE 0 END) as leads_drop,
        SUM(CASE WHEN vl.called_count > 0 THEN 1 ELSE 0 END) as leads_called,
        ROUND((SUM(CASE WHEN vl.status IN ('PU', 'PM', 'SVYEXT', 'SALE', 'DNC', 'NI', 'DC', 'ADC', 'SVYHU', 'SVYVM') THEN 1 ELSE 0 END) * 100.0 / COUNT(vl.lead_id)), 2) as progress_percentage
      FROM vicidial_lists vls
      LEFT JOIN vicidial_list vl ON vls.list_id = vl.list_id
      WHERE vls.campaign_id = ?
      GROUP BY vls.list_id, vls.list_name, vls.active
      ORDER BY vls.list_id
    `;

    return await database.query(sql, [campaignId]);
  }

  /**
   * Get campaign call activity (today)
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>}
   */
  async getCampaignCallActivity(campaignId) {
    const sql = `
      SELECT
        COUNT(*) as total_calls,
        SUM(CASE WHEN status = 'SALE' THEN 1 ELSE 0 END) as sales,
        SUM(CASE WHEN status IN ('A', 'XFER') THEN 1 ELSE 0 END) as transfers,
        SUM(CASE WHEN status = 'DROP' THEN 1 ELSE 0 END) as drops,
        SUM(CASE WHEN status = 'NA' THEN 1 ELSE 0 END) as no_answer,
        SUM(CASE WHEN status = 'B' THEN 1 ELSE 0 END) as busy,
        SUM(length_in_sec) as total_talk_time,
        AVG(CASE WHEN length_in_sec > 0 THEN length_in_sec ELSE NULL END) as avg_talk_time,
        COUNT(DISTINCT user) as active_agents
      FROM vicidial_log
      WHERE campaign_id = ?
        AND call_date >= CURDATE()
    `;

    const results = await database.query(sql, [campaignId]);
    return results[0] || null;
  }

  /**
   * Get campaign hourly activity (today)
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>}
   */
  async getCampaignHourlyActivity(campaignId) {
    const sql = `
      SELECT
        HOUR(call_date) as hour,
        COUNT(*) as calls,
        SUM(CASE WHEN status = 'SALE' THEN 1 ELSE 0 END) as sales,
        SUM(CASE WHEN length_in_sec > 0 THEN length_in_sec ELSE 0 END) as talk_time
      FROM vicidial_log
      WHERE campaign_id = ?
        AND call_date >= CURDATE()
      GROUP BY HOUR(call_date)
      ORDER BY hour
    `;

    return await database.query(sql, [campaignId]);
  }

  /**
   * Get campaign agents performance
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>}
   */
  async getCampaignAgentsPerformance(campaignId) {
    const sql = `
      SELECT
        vlog.user,
        vu.full_name,
        COUNT(*) as total_calls,
        SUM(CASE WHEN vlog.status = 'SALE' THEN 1 ELSE 0 END) as sales,
        SUM(CASE WHEN vlog.status IN ('A', 'XFER') THEN 1 ELSE 0 END) as transfers,
        SUM(vlog.length_in_sec) as total_talk_time,
        AVG(CASE WHEN vlog.length_in_sec > 0 THEN vlog.length_in_sec ELSE NULL END) as avg_talk_time,
        ROUND((SUM(CASE WHEN vlog.status = 'SALE' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as conversion_rate
      FROM vicidial_log vlog
      LEFT JOIN vicidial_users vu ON vlog.user = vu.user
      WHERE vlog.campaign_id = ?
        AND vlog.call_date >= CURDATE()
      GROUP BY vlog.user, vu.full_name
      HAVING total_calls > 0
      ORDER BY sales DESC, total_calls DESC
      LIMIT 50
    `;

    return await database.query(sql, [campaignId]);
  }

  /**
   * Execute custom query (use with caution)
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>}
   */
  async executeQuery(sql, params = []) {
    return await database.query(sql, params);
  }

  /**
   * Get campaigns summary with metrics
   * Returns comprehensive campaign metrics including leads, contacted, success rates, and active agents
   * @param {string[]} campaigns - Optional array of campaign IDs to filter
   * @returns {Promise<Array>}
   */
  async getCampaignsSummary(campaigns = null) {
    const sql = `
      SELECT
        vc.campaign_id,
        vc.campaign_name,
        vc.active,
        COALESCE(leads.total_leads, 0) AS total_leads,
        COALESCE(dispo.contactados, 0) AS contactados,
        COALESCE(dispo.exitosos, 0) AS exitosos,
        (COALESCE(leads.total_leads, 0) - COALESCE(dispo.contactados, 0)) AS pendientes,
        ROUND((COALESCE(dispo.contactados, 0) / NULLIF(leads.total_leads, 0)) * 100, 2) AS progreso_pct,
        ROUND((COALESCE(dispo.exitosos, 0) / NULLIF(dispo.contactados, 0)) * 100, 2) AS tasa_exito_pct,
        (SELECT COUNT(*)
         FROM vicidial_live_agents vla
         WHERE vla.campaign_id = vc.campaign_id) AS agentes_activos
      FROM vicidial_campaigns vc
      -- Subquery: total de leads por campaña
      LEFT JOIN (
        SELECT
          vlst.campaign_id,
          COUNT(*) AS total_leads
        FROM vicidial_list l
        JOIN vicidial_lists vlst ON l.list_id = vlst.list_id
        WHERE l.status NOT IN ('DC', 'DNC', 'XFER')
        GROUP BY vlst.campaign_id
      ) leads ON leads.campaign_id = vc.campaign_id
      -- Subquery: contactados y exitosos (solo de hoy)
      LEFT JOIN (
        SELECT
          vlst.campaign_id,
          SUM(CASE WHEN vl.status IS NOT NULL AND vl.status <> '' THEN 1 ELSE 0 END) AS contactados,
          SUM(CASE WHEN vl.status IN ('SALE', 'PU', 'PM') THEN 1 ELSE 0 END) AS exitosos
        FROM vicidial_log vl
        JOIN vicidial_lists vlst ON vl.list_id = vlst.list_id
        WHERE vl.call_date >= CURDATE()
        GROUP BY vlst.campaign_id
      ) dispo ON dispo.campaign_id = vc.campaign_id
      ${campaigns && campaigns.length > 0 ? `WHERE vc.campaign_id IN (${campaigns.map(() => '?').join(',')})` : ''}
      ORDER BY vc.campaign_name
    `;

    const params = campaigns && campaigns.length > 0 ? campaigns : [];
    return await database.query(sql, params);
  }

  /**
   * Get leads by list ID with pagination
   * @param {string} listId - List ID
   * @param {number} limit - Max rows to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>}
   */
  async getLeadsByListId(listId, limit = 100, offset = 0) {
    const sql = `
      SELECT
        vl.lead_id,
        vl.phone_number,
        vl.vendor_lead_code,
        vl.status,
        vl.first_name,
        vl.last_name,
        vl.called_count,
        vl.last_local_call_time,
        vl.entry_date,
        vl.modify_date
      FROM vicidial_list vl
      WHERE vl.list_id = ?
      ORDER BY vl.lead_id DESC
      LIMIT ? OFFSET ?
    `;

    return await database.query(sql, [listId, limit, offset]);
  }

  /**
   * Get total leads count for a list
   * @param {string} listId - List ID
   * @returns {Promise<number>}
   */
  async getLeadsCountByListId(listId) {
    const sql = `
      SELECT COUNT(*) as total
      FROM vicidial_list
      WHERE list_id = ?
    `;

    const results = await database.query(sql, [listId]);
    return results[0]?.total || 0;
  }

  /**
   * Get campaigns status (replacement for Vicibroker campaigns_status)
   * @param {string[]} campaigns - Array of campaign IDs
   * @returns {Promise<Array>}
   */
  async getCampaignsStatus(campaigns) {
    let sql = `
      SELECT 
        c.campaign_id,
        c.campaign_name,
        c.active,
        c.dial_method,
        c.dial_status_a as dial_status,
        c.lead_order,
        c.hopper_level,
        c.auto_dial_level,
        CASE 
          WHEN c.active = 'Y' THEN 'Activa'
          WHEN c.active = 'N' THEN 'Inactiva'
          ELSE 'Pausada'
        END as estado
      FROM vicidial_campaigns c
    `;

    let params = [];
    if (campaigns && campaigns.length > 0) {
      const placeholders = campaigns.map(() => '?').join(',');
      sql += ` WHERE c.campaign_id IN (${placeholders})`;
      params = campaigns;
    }

    sql += ' ORDER BY c.campaign_name';

    return await database.query(sql, params);
  }

  /**
   * Get lists count by campaign (replacement for Vicibroker lists_count_by_campaign)
   * @param {string[]} campaigns - Array of campaign IDs
   * @returns {Promise<Array>}
   */
  async getListsCountByCampaign(campaigns) {
    let sql = `
      SELECT 
        vls.campaign_id,
        COUNT(DISTINCT vls.list_id) as cantidad_listas,
        SUM(CASE WHEN vl.lead_id IS NOT NULL THEN 1 ELSE 0 END) as total_leads
      FROM vicidial_lists vls
      LEFT JOIN vicidial_list vl ON vls.list_id = vl.list_id
    `;

    let params = [];
    if (campaigns && campaigns.length > 0) {
      const placeholders = campaigns.map(() => '?').join(',');
      sql += ` WHERE vls.campaign_id IN (${placeholders})`;
      params = campaigns;
    }

    sql += ' GROUP BY vls.campaign_id';

    return await database.query(sql, params);
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;
