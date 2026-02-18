import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import salesRoutes from './routes/sales.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import healthRoutes from './routes/health.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import productImportRoutes from "./routes/productImport.routes.js";
import promoRoutes from './routes/promos.routes.js';
import promoSeedRoutes from './routes/promos.seed.routes.js';
import promoManageRoutes from "./routes/promos.manage.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/sales', salesRoutes);
app.use('/reports', reportsRoutes);
app.use('/categories', categoriesRoutes);
app.use("/import/products", productImportRoutes);
app.use('/promos', promoRoutes);
app.use('/promos', promoSeedRoutes);
app.use("/promos/manage", promoManageRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  await connectDB(process.env.MONGO_URI);
  console.log(`✅ Server running on http://localhost:${PORT}`);
});