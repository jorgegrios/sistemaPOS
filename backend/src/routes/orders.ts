import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  // Create order
  const { items, tableId, waiterId } = req.body;
  // TODO: persist order and send to KDS
  return res.json({ ok: true, orderId: 'order_123' });
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  // TODO: retrieve order
  return res.json({ id, status: 'pending' });
});

router.patch('/:id/status', async (req, res) => {
  // Update status and push to KDS
  return res.json({ ok: true });
});

router.post('/:id/split', async (req, res) => {
  return res.json({ ok: true });
});

router.post('/:id/merge', async (req, res) => {
  return res.json({ ok: true });
});

export default router;
