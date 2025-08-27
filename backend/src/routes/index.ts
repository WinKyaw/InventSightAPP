import { Router } from 'express';
import authRoutes from './authRoutes';
import { ApiResponse } from '../types';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  };
  
  res.status(200).json(response);
});

// API info endpoint
router.get('/', (_req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'InventSight API',
      version: '1.0.0',
      description: 'Comprehensive backend API for InventSight App with registration and authentication',
      endpoints: {
        health: '/health',
        auth: '/auth/*',
        documentation: '/docs',
      },
      environment: process.env.NODE_ENV || 'development',
    },
    message: 'InventSight API is running',
    timestamp: new Date().toISOString(),
  };
  
  res.status(200).json(response);
});

export default router;