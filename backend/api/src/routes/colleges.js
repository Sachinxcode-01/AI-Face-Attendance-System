const express = require('express');
const router = express.Router();
const collegeDbService = require('../services/collegeDbService');

/**
 * GET /colleges/search
 * Search colleges by keyword
 * Query params:
 *   q: search term (min 2 chars)
 *   limit: optional maximum results (default 20, max 50)
 */
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        results: [],
        query: q,
        message: 'Query must be at least 2 characters.'
      });
    }

    const data = await collegeDbService.searchColleges(q, limit);
    return res.json({
      success: true,
      ...data
    });
  } catch (err) {
    console.error('[Colleges Route] Search error:', err);
    return res.status(500).json({
      success: false,
      detail: 'Failed to search colleges',
      results: []
    });
  }
});

/**
 * GET /colleges/:id
 * Retrieve details for a specific college
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.trim() === '') {
      return res.status(400).json({ success: false, detail: 'College ID is required' });
    }

    const college = await collegeDbService.getCollegeById(id.trim());
    if (!college) {
      return res.status(404).json({ success: false, detail: 'College not found' });
    }

    return res.json({
      success: true,
      college
    });
  } catch (err) {
    console.error('[Colleges Route] Get by ID error:', err);
    return res.status(500).json({ success: false, detail: 'Failed to fetch college details' });
  }
});

/**
 * GET /colleges
 * List colleges with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 50);

    const listData = await collegeDbService.listColleges(page, pageSize);
    return res.json({
      success: true,
      ...listData
    });
  } catch (err) {
    console.error('[Colleges Route] List error:', err);
    return res.status(500).json({ success: false, detail: 'Failed to list colleges' });
  }
});

module.exports = router;
