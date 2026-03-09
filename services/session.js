/**
 * Session Manager
 * Tracks each user's current position in the conversation flow.
 * Uses an in-memory Map with auto-expiry after inactivity.
 */

const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes of inactivity resets state

const sessions = new Map(); // phone → { state, context, lastActivity }

/**
 * Get or create a session for a phone number.
 * Auto-resets expired sessions.
 */
function getSession(phone) {
    const now = Date.now();
    const existing = sessions.get(phone);

    if (existing) {
        // Reset if expired
        if (now - existing.lastActivity > EXPIRY_MS) {
            sessions.delete(phone);
        } else {
            existing.lastActivity = now;
            return existing;
        }
    }

    const session = { state: "idle", context: {}, lastActivity: now };
    sessions.set(phone, session);
    return session;
}

/**
 * Set the state for a user's session.
 * @param {string} phone
 * @param {string} state   - e.g. "main_menu", "awaiting_order_id", "tour_detail"
 * @param {object} context - any extra data to store (e.g. { tourKey: "desert" })
 */
function setState(phone, state, context = {}) {
    const session = getSession(phone);
    session.state = state;
    session.context = { ...session.context, ...context };
    session.lastActivity = Date.now();
}

function resetSession(phone) {
    sessions.delete(phone);
}

module.exports = { getSession, setState, resetSession };
