import express from 'express';
import { WebDAVService } from '../../lib/webdavService';

const router = express.Router();

router.get('/status', async (req, res) => {
  const cli = await WebDAVService.getClient();
  res.json({ enabled: !!cli });
});

router.post('/push', async (req, res) => {
  try {
    const result = await WebDAVService.pushNotes();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/pull', async (req, res) => {
  try {
    const result = await WebDAVService.pullNotes();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;

