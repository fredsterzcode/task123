import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionsRouter from './routes/sessions';
import usersRouter from './routes/users';
import reportsRouter from './routes/reports';
import aiScoreRouter from './routes/aiScore';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai-score', aiScoreRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RealCheck backend is running!' });
});

app.listen(PORT, () => {
  console.log(`RealCheck backend listening on port ${PORT}`);
}); 