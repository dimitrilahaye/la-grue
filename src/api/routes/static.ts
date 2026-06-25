import { Router, Request, Response } from 'express';
import path from 'path';

const router = Router();
const frontendDir = path.resolve(__dirname, '../../..', 'frontend');

router.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

export { frontendDir };
export default router;
