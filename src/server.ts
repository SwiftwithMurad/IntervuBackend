import { env } from './config/env';
import app from './app';
import { connectMongo } from './db/connectMongo';

async function main(): Promise<void> {
  await connectMongo();
  console.log('MongoDB connected');

  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
