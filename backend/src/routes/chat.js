const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createLead, addMessage, getMessages, updateLead, getLead } = require('../db');
const { chat } = require('../gemini');
const { extractLeadData } = require('../extractLeadData');

const router = express.Router();

/**
 * POST /api/chat/start
 * Start a new chat session
 */
router.post('/start', async (req, res) => {
  try {
    const sessionId = uuidv4();

    console.log('[START] Step 1: Creating lead in DB...');
    createLead(sessionId);
    console.log('[START] Step 2: Lead created. Calling Gemini...');

    const greeting = await chat([
      { role: 'user', content: 'Hi' },
    ]);
    console.log('[START] Step 3: Gemini replied. Saving message...');

    addMessage(sessionId, 'assistant', greeting);
    console.log('[START] Step 4: Done!');

    res.json({
      success: true,
      sessionId,
      message: greeting,
    });
  } catch (error) {
    console.error('[START] ❌ FULL ERROR:', error.stack || error.message || error);
    res.status(500).json({ success: false, error: error.message || 'Failed to start chat session' });
  }
});


/**
 * POST /api/chat
 * Send a message and get AI response
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ success: false, error: 'sessionId and message are required' });
    }

    // Check if session exists
    const lead = getLead(sessionId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Save user message
    addMessage(sessionId, 'user', message);

    // Get full conversation history
    const allMessages = getMessages(sessionId);
    const conversationHistory = allMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Get AI response
    const aiResponse = await chat(conversationHistory);

    // Save AI response
    addMessage(sessionId, 'assistant', aiResponse);

    // Extract lead data in background (don't wait/block)
    extractLeadData(conversationHistory).then((extractedData) => {
      if (extractedData && Object.keys(extractedData).length > 0) {
        // Only update non-null fields
        const cleanData = {};
        for (const [key, value] of Object.entries(extractedData)) {
          if (value !== null && value !== undefined && value !== '') {
            cleanData[key] = value;
          }
        }
        if (Object.keys(cleanData).length > 0) {
          updateLead(sessionId, cleanData);
        }
      }
    }).catch((err) => {
      console.error('Background lead extraction failed:', err.message);
    });

    res.json({
      success: true,
      sessionId,
      response: aiResponse,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: 'Failed to process message' });
  }
});

/**
 * GET /api/chat/:sessionId
 * Get chat history for a session
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const lead = getLead(sessionId);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const messages = getMessages(sessionId);

    res.json({
      success: true,
      sessionId,
      lead,
      messages,
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ success: false, error: 'Failed to get chat history' });
  }
});

module.exports = router;
