import { withApi } from '../../middleware';
import { query, insert, update, remove } from '../../utils/database';

const getPolicies = async (req, res) => {
  const { device_id } = req.query;
  let sql = 'SELECT * FROM device_policies';
  const params = [];
  if (device_id) {
    sql += ' WHERE device_id = ?';
    params.push(device_id);
  }
  const policies = await query(sql, params);
  res.status(200).json({ data: policies });
};

const createPolicy = async (req, res) => {
  const { device_id, policy_key, policy_value, description, data_type, enforced } = req.body;
  if (!device_id || !policy_key) return res.status(400).json({ error: 'device_id and policy_key required' });
  const id = await insert('device_policies', { device_id, policy_key, policy_value, description, data_type, enforced });
  res.status(201).json({ id });
};

const updatePolicy = async (req, res) => {
  const { id, ...fields } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await update('device_policies', fields, { id });
  res.status(200).json({ success: true });
};

const deletePolicy = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await remove('device_policies', { id });
  res.status(200).json({ success: true });
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET': return getPolicies(req, res);
    case 'POST': return createPolicy(req, res);
    case 'PUT': return updatePolicy(req, res);
    case 'DELETE': return deletePolicy(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withApi(handler, { auth: req => ['POST','PUT','DELETE'].includes(req.method) }); 