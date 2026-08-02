import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products';
import vendorsRouter from './routes/vendors';
import purchaseRouter from './routes/purchase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/purchase', purchaseRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Rx3000 Backend API', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Rx3000 Backend Server listening on http://localhost:${PORT}`);
});
