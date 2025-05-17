import { withApi } from '../../middleware';
import { query, insert, update, remove } from '../../utils/database';

const getPreferences = async (req, res) => {
  const { user_id } = req.query;
  let sql = 'SELECT * FROM user_preferences';
  const params = [];
  if (user_id) {
    sql += ' WHERE user_id = ?';
    params.push(user_id);
  }
  const prefs = await query(sql, params);
  res.status(200).json({ data: prefs });
};

const createPreference = async (req, res) => {
  const { user_id, preference_key, preference_value, data_type } = req.body;
  if (!user_id || !preference_key) return res.status(400).json({ error: 'user_id and preference_key required' });
  const id = await insert('user_preferences', { user_id, preference_key, preference_value, data_type });
  res.status(201).json({ id });
};

const updatePreference = async (req, res) => {
  const { id, ...fields } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await update('user_preferences', fields, { id });
  res.status(200).json({ success: true });
};

const deletePreference = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await remove('user_preferences', { id });
  res.status(200).json({ success: true });
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET': return getPreferences(req, res);
    case 'POST': return createPreference(req, res);
    case 'PUT': return updatePreference(req, res);
    case 'DELETE': return deletePreference(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withApi(handler, { auth: req => ['POST','PUT','DELETE'].includes(req.method) }); 