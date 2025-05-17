import { withApi } from '../../middleware';
import { query, insert, update, remove } from '../../utils/database';

const getPanels = async (req, res) => {
  const panels = await query('SELECT * FROM control_panels');
  res.status(200).json({ data: panels });
};

const createPanel = async (req, res) => {
  const { name, description, location, type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = await insert('control_panels', { name, description, location, type });
  res.status(201).json({ id });
};

const updatePanel = async (req, res) => {
  const { id, ...fields } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await update('control_panels', fields, { id });
  res.status(200).json({ success: true });
};

const deletePanel = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await remove('control_panels', { id });
  res.status(200).json({ success: true });
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET': return getPanels(req, res);
    case 'POST': return createPanel(req, res);
    case 'PUT': return updatePanel(req, res);
    case 'DELETE': return deletePanel(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withApi(handler, { auth: req => ['POST','PUT','DELETE'].includes(req.method) }); 