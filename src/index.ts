import 'dotenv/config';
import { createApp } from './api/server';

const port = parseInt(process.env.PORT ?? '3000', 10);
const app = createApp();

app.listen(port, () => {
  console.log(`[La Grue] Server running on http://localhost:${port}`);
});
