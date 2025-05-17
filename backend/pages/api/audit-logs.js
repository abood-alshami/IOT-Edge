import { withApi } from '../../middleware';
import { query, insert, remove } from '../../utils/database';

const getLogs = async (req, res) => {
  const { user_id, entity_type, entity_id, action } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  if (user_id) {
    sql += ' AND user_id = ?';
    params.push(user_id);
  }
  if (entity_type) {
    sql += ' AND entity_type = ?';
    params.push(entity_type);
  }
  if (entity_id) {
    sql += ' AND entity_id = ?';
    params.push(entity_id);
  }
  if (action) {
    sql += ' AND action = ?';
    params.push(action);
  }
  sql += ' ORDER BY timestamp DESC LIMIT 200';
  const logs = await query(sql, params);
  res.status(200).json({ data: logs });
};

const createLog = async (req, res) => {
  const { user_id, action, entity_type, entity_id, details } = req.body;
  if (!user_id || !action) return res.status(400).json({ error: 'user_id and action required' });
  const id = await insert('audit_logs', { user_id, action, entity_type, entity_id, details });
  res.status(201).json({ id });
};

const deleteLog = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  // Optionally, check if user is admin here
  await remove('audit_logs', { id });
  res.status(200).json({ success: true });
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET': return getLogs(req, res);
    case 'POST': return createLog(req, res);
    case 'DELETE': return deleteLog(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withApi(handler, { auth: req => ['POST','DELETE'].includes(req.method) }); 