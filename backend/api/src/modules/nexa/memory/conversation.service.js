'use strict';

const mongoose = require('mongoose');
const NexaConversation = require('../../../models/NexaConversation');
const UserAssistantPreference = require('../../../models/UserAssistantPreference');
const AssistantFeedback = require('../../../models/AssistantFeedback');

/**
 * Resolves a valid MongoDB ObjectId for a conversation or mints a new one,
 * ensuring the client receives the canonical persisted ID.
 */
function resolveConversationObjectId(convId) {
  if (convId && mongoose.Types.ObjectId.isValid(convId)) {
    return new mongoose.Types.ObjectId(convId);
  }
  return new mongoose.Types.ObjectId();
}

async function persistTurn({
  conversationId,
  userEmail,
  userRole,
  collegeId,
  language,
  userText,
  assistantText,
  suggestedActions = [],
  sources = [],
  toolsUsed = [],
  pendingAction = null,
}) {
  const canonicalId = resolveConversationObjectId(conversationId);
  const canonicalIdStr = canonicalId.toString();

  if (mongoose.connection.readyState !== 1) {
    return { conversationId: canonicalIdStr, userMsgId: `msg_u_${Date.now()}`, assistantMsgId: `msg_a_${Date.now() + 1}` };
  }

  const userMsgId = `msg_u_${Date.now()}`;
  const assistantMsgId = `msg_a_${Date.now() + 1}`;
  const now = new Date();

  const userMsg = {
    id: userMsgId,
    role: 'user',
    content: userText,
    createdAt: now,
  };
  const aiMsg = {
    id: assistantMsgId,
    role: 'assistant',
    content: assistantText,
    suggestedActions,
    sources,
    toolsUsed,
    pendingAction,
    createdAt: new Date(now.getTime() + 1),
  };

  await NexaConversation.findOneAndUpdate(
    { _id: canonicalId, user_email: userEmail.toLowerCase() },
    {
      $setOnInsert: {
        user_email: userEmail.toLowerCase(),
        user_role: String(userRole || 'student').toLowerCase(),
        college_id: collegeId || undefined,
        title: userText.slice(0, 60),
        created_at: now,
      },
      $set: {
        updated_at: now,
        language: language || 'en',
      },
      $push: { messages: { $each: [userMsg, aiMsg], $slice: -60 } },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return { conversationId: canonicalIdStr, userMsgId, assistantMsgId };
}

async function listConversations(userEmail, { limit = 25, includeArchived = false, search = '' } = {}) {
  if (mongoose.connection.readyState !== 1) return [];
  const filter = { user_email: userEmail.toLowerCase() };
  if (!includeArchived) filter.archived = { $ne: true };
  if (search && typeof search === 'string') {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escaped) {
      filter.$or = [{ title: { $regex: escaped, $options: 'i' } }];
    }
  }
  const convs = await NexaConversation.find(filter)
    .sort({ updated_at: -1 })
    .limit(Math.min(50, Math.max(1, Number(limit) || 25)))
    .lean();

  return convs.map((c) => ({
    id: c._id.toString(),
    title: c.title,
    language: c.language || 'en',
    archived: Boolean(c.archived),
    message_count: (c.messages || []).length,
    updated_at: c.updated_at,
    created_at: c.created_at,
    messages: c.messages || [],
  }));
}

async function getConversationContext(conversationId, userEmail) {
  if (mongoose.connection.readyState !== 1 || !conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }
  return NexaConversation.findOne({ _id: conversationId, user_email: userEmail.toLowerCase() })
    .select('messages summary context_state language')
    .lean();
}

async function updateConversation(conversationId, userEmail, updates = {}) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;
  const setFields = { updated_at: new Date() };
  if (typeof updates.title === 'string' && updates.title.trim()) {
    setFields.title = updates.title.trim().slice(0, 120);
  }
  if (typeof updates.archived === 'boolean') {
    setFields.archived = updates.archived;
  }
  return NexaConversation.findOneAndUpdate(
    { _id: conversationId, user_email: userEmail.toLowerCase() },
    { $set: setFields },
    { returnDocument: 'after' }
  ).lean();
}

async function deleteConversation(conversationId, userEmail) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;
  return NexaConversation.findOneAndDelete({ _id: conversationId, user_email: userEmail.toLowerCase() });
}

async function getUserPreferences(userEmail) {
  if (mongoose.connection.readyState !== 1) {
    return { preferred_language: 'en', response_detail: 'balanced', attendance_target: 75, voice_rate: 0.5 };
  }
  const doc = await UserAssistantPreference.findOne({ user_email: userEmail.toLowerCase() }).lean();
  return doc || { preferred_language: 'en', response_detail: 'balanced', attendance_target: 75, voice_rate: 0.5 };
}

async function upsertUserPreferences(userEmail, collegeId, updates = {}) {
  if (mongoose.connection.readyState !== 1) return updates;
  const setFields = { updated_at: new Date() };
  if (['en', 'kn', 'hi', 'hinglish'].includes(updates.preferred_language)) {
    setFields.preferred_language = updates.preferred_language;
  }
  if (['concise', 'balanced', 'detailed'].includes(updates.response_detail)) {
    setFields.response_detail = updates.response_detail;
  }
  if (typeof updates.attendance_target === 'number' && updates.attendance_target >= 1 && updates.attendance_target <= 100) {
    setFields.attendance_target = updates.attendance_target;
  }
  if (typeof updates.voice_rate === 'number' && updates.voice_rate >= 0.25 && updates.voice_rate <= 2.0) {
    setFields.voice_rate = updates.voice_rate;
  }
  if (typeof updates.proactive_alerts_enabled === 'boolean') {
    setFields.proactive_alerts_enabled = updates.proactive_alerts_enabled;
  }

  return UserAssistantPreference.findOneAndUpdate(
    { user_email: userEmail.toLowerCase() },
    { $set: setFields, $setOnInsert: { user_email: userEmail.toLowerCase(), college_id: collegeId || undefined } },
    { upsert: true, returnDocument: 'after' }
  ).lean();
}

async function recordFeedback({ responseId, conversationId, userEmail, userRole, collegeId, rating, category, currentRoute, feedback }) {
  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  if (mongoose.connection.readyState === 1) {
    await AssistantFeedback.create({
      feedback_id: feedbackId,
      response_id: responseId || `resp_${Date.now()}`,
      conversation_id: conversationId || null,
      user_email: userEmail.toLowerCase(),
      user_role: String(userRole || 'student').toLowerCase(),
      college_id: collegeId || null,
      rating,
      category: category || 'general',
      current_route: currentRoute || '',
      feedback: typeof feedback === 'string' ? feedback.slice(0, 500) : '',
    });
  }
  return feedbackId;
}

module.exports = {
  resolveConversationObjectId,
  persistTurn,
  listConversations,
  getConversationContext,
  updateConversation,
  deleteConversation,
  getUserPreferences,
  upsertUserPreferences,
  recordFeedback,
};
