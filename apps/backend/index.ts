import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionsRouter from './routes/sessions';
import usersRouter from './routes/users';
import reportsRouter from './routes/reports';
import aiScoreRouter from './routes/aiScore';
import invitesRouter from './routes/invites';
import analyticsRouter from './routes/analytics';
import authRouter from './routes/auth';
import friendRequestsRouter from './routes/friendRequests';
import friendsRouter from './routes/friends';
import userSearchRouter from './routes/userSearch';
import chatsRouter from './routes/chats';
import groupCallsRouter from './routes/groupCalls';
import presenceRouter from './routes/presence';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai-score', aiScoreRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);
app.use('/api/friend-requests', friendRequestsRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/user-search', userSearchRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/group-calls', groupCallsRouter);
app.use('/api/presence', presenceRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RealCheck Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      sessions: '/api/sessions',
      users: '/api/users',
      reports: '/api/reports',
      aiScore: '/api/ai-score',
      invites: '/api/invites',
      analytics: '/api/analytics',
      auth: '/api/auth',
      friendRequests: '/api/friend-requests',
      friends: '/api/friends',
      userSearch: '/api/user-search',
      chats: '/api/chats',
      groupCalls: '/api/group-calls',
      presence: '/api/presence'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RealCheck backend is running!' });
});

export default app; 