import 'dotenv/config';
import { createApp } from './app';
import { createDb } from './db';

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET;
const DB_PATH = process.env.DB_PATH ?? './data.sqlite';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const db = createDb(DB_PATH);
const app = createApp({ db, jwtSecret: JWT_SECRET, clientOrigin: CLIENT_ORIGIN });

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
