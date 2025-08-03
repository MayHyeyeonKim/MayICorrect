import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import correctionRouter from './routes/correction';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api', correctionRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'May I Correct API is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
