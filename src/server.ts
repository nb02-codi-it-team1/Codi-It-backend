import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { PORT } from './common/constants';

dotenv.config();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
