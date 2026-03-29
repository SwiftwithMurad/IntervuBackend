import mongoose from 'mongoose';
import { env } from './config/env';
import app from './app';

async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected');

  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
