import { withApi } from '../../middleware';
import { query, insert, update, remove } from '../../utils/database';

const getSettings = async (req, res) => {
  const { panel_id } = req.query;
  let sql = 'SELECT * FROM control_settings';
  const params = [];
  if (panel_id) {
    sql += ' WHERE panel_id = ?';
    params.push(panel_id);
  }
  const settings = await query(sql, params);
  res.status(200).json({ data: settings });
};

const createSetting = async (req, res) => {
  const { panel_id, setting_key, setting_value, description, data_type } = req.body;
  if (!setting_key) return res.status(400).json({ error: 'setting_key required' });
  const id = await insert('control_settings', { panel_id, setting_key, setting_value, description, data_type });
  res.status(201).json({ id });
};

const updateSetting = async (req, res) => {
  const { id, ...fields } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await update('control_settings', fields, { id });
  res.status(200).json({ success: true });
};

const deleteSetting = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await remove('control_settings', { id });
  res.status(200).json({ success: true });
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET': return getSettings(req, res);
    case 'POST': return createSetting(req, res);
    case 'PUT': return updateSetting(req, res);
    case 'DELETE': return deleteSetting(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withApi(handler, { auth: req => ['POST','PUT','DELETE'].includes(req.method) }); 