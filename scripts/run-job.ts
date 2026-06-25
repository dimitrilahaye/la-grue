import 'dotenv/config';
import { runJob } from '../src/job';

runJob().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
