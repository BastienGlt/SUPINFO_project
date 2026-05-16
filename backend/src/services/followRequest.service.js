const db = require('../../config/db');
const notificationService = require('./notification.service');

exports.createRequest = async (requesterId, targetId) => {
  const sql = `
    INSERT INTO follow_requests (requester_id, target_id, status, created_at)
    VALUES (?, ?, 'pending', NOW())
  `;
  const [result] = await db.query(sql, [requesterId, targetId]);

  notificationService.createNotification(targetId, requesterId, 'follow_request', requesterId).catch(console.error);

  return { id: result.insertId, status: 'pending' };
};

exports.getPendingRequests = async (targetId) => {
  const sql = `
    SELECT fr.id, fr.requester_id, fr.created_at,
           u.pseudo, u.prenom, u.nom, u.photo
    FROM follow_requests fr
    JOIN users u ON u.id = fr.requester_id
    WHERE fr.target_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `;
  const [rows] = await db.query(sql, [targetId]);
  return rows;
};

exports.respondToRequest = async (requestId, targetId, action) => {
  const [rows] = await db.query(
    'SELECT * FROM follow_requests WHERE id = ? AND target_id = ? AND status = "pending"',
    [requestId, targetId]
  );

  if (rows.length === 0) return null;

  const request = rows[0];

  if (action === 'accept') {
    await db.query(
      'INSERT IGNORE INTO followers (user_sub, user_follow, created_at) VALUES (?, ?, NOW())',
      [request.requester_id, targetId]
    );
    await db.query(
      'UPDATE follow_requests SET status = "accepted", updated_at = NOW() WHERE id = ?',
      [requestId]
    );
    notificationService.createNotification(request.requester_id, targetId, 'follow', request.requester_id).catch(console.error);
    return { status: 'accepted' };
  }

  await db.query(
    'UPDATE follow_requests SET status = "rejected", updated_at = NOW() WHERE id = ?',
    [requestId]
  );
  return { status: 'rejected' };
};

exports.hasPendingRequest = async (requesterId, targetId) => {
  const [rows] = await db.query(
    'SELECT 1 FROM follow_requests WHERE requester_id = ? AND target_id = ? AND status = "pending"',
    [requesterId, targetId]
  );
  return rows.length > 0;
};
