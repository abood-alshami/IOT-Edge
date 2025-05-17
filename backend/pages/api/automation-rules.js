import { withApi } from '../../middleware';
import { query, insert, update, remove } from '../../utils/database';

const getRules = async (req, res) => {
  const { enabled, created_by } = req.query;
  let sql = 'SELECT * FROM automation_rules WHERE 1=1';
  const params = [];
  if (enabled !== undefined) {
    sql += ' AND enabled = ?';
    params.push(enabled === 'true' ? 1 : 0);
  }
  if (created_by) {
    sql += ' AND created_by = ?';
    params.push(created_by);
  }
  const rules = await query(sql, params);
  res.status(200).json({ data: rules });
};

const createRule = async (req, res) => {
  const { name, description, trigger_type, trigger_config, action_type, action_config, enabled, created_by } = req.body;
  if (!name || !trigger_type || !action_type) return res.status(400).json({ error: 'name, trigger_type, and action_type required' });
  const id = await insert('automation_rules', { name, description, trigger_type, trigger_config, action_type, action_config, enabled, created_by });
  res.status(201).json({ id });
};

const updateRule = async (req, res) => {
  const { id, ...fields } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await update('automation_rules', fields, { id });
  res.status(200).json({ success: true });
};

const deleteRule = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await remove('automation_rules', { id });
  res.status(200).json({ success: true });
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET': return getRules(req, res);
    case 'POST': return createRule(req, res);
    case 'PUT': return updateRule(req, res);
    case 'DELETE': return deleteRule(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withApi(handler, { auth: req => ['POST','PUT','DELETE'].includes(req.method) }); 