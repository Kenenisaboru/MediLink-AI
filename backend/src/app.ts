import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import apiRouter from './routes/api.routes';
import { initSOSGateway } from './services/sos.gateway';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific frontend domains
    methods: ['GET', 'POST'],
  },
});

// Configure middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Set up API rate limiter (protecting server against DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', limiter);

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Global error handler
app.use(((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error: ' + err.message });
}) as any);

// Initialize Socket.io SOS tracks
initSOSGateway(io);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 MediLink AI Server running on port ${PORT}`);
    console.log(`📦 Node Env: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });
}

export { app, server };
