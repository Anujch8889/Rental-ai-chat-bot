const express = require('express');
const { getAllLeads, getLeadById, updateLeadById, deleteLeadById, getStats, getMessages } = require('../db');

const router = express.Router();

/**
 * GET /api/admin/leads
 * List all leads with optional filters
 * Query params: status, city, search
 */
router.get('/leads', (req, res) => {
  try {
    const { status, city, search } = req.query;
    const filters = {};

    if (status && status !== 'all') filters.status = status;
    if (city) filters.city = city;
    if (search) filters.search = search;

    const leads = getAllLeads(filters);

    res.json({
      success: true,
      leads,
      total: leads.length,
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({ success: false, error: 'Failed to get leads' });
  }
});

/**
 * GET /api/admin/leads/:id
 * Get single lead with full chat history
 */
router.get('/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const lead = getLeadById(parseInt(id));

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const messages = getMessages(lead.session_id);

    res.json({
      success: true,
      lead,
      messages,
    });
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to get lead' });
  }
});

/**
 * PATCH /api/admin/leads/:id
 * Update lead status or other fields
 */
router.patch('/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const lead = getLeadById(parseInt(id));
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    updateLeadById(parseInt(id), data);
    const updatedLead = getLeadById(parseInt(id));

    res.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

/**
 * DELETE /api/admin/leads/:id
 * Delete a lead and its messages
 */
router.delete('/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = deleteLeadById(parseInt(id));

    if (!result) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

module.exports = router;
