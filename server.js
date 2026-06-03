import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables from root .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

// Enable gzip compression for better production performance
app.use(compression());

// Request logging in production format
// Using 'combined' format for full Apache-style logs, falls back to 'dev' if process.env.NODE_ENV is not prod
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Security Headers via Helmet
// Custom Content Security Policy to allow Supabase connections, YouTube video frames, and styled-components inline CSS
app.use(
  helmet({
    contentSecurityPolicy: process.env.DISABLE_CSP === 'true' ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://*.supabase.co"
        ],
        mediaSrc: [
          "'self'",
          "https://*.supabase.co"
        ],
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://*.youtube.com",
          "https://player.vimeo.com",  // Vimeo embed player
          "https://vimeo.com",         // Vimeo direct links
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);


// Rate Limiting to protect against DoS/Brute Force
// Limit each IP to 200 requests per minute on non-static routes
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  // Do not rate limit requests for static assets (JS, CSS, images, etc.)
  skip: (req) => {
    return req.path.includes('/assets/') || req.path.includes('.');
  }
});
app.use(limiter);

// Health Check Endpoint (useful for uptime monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve Admin app static assets
// Mounting under /admin so express.static will check inside dist/admin for files requested relative to /admin
app.use('/admin', express.static(path.join(__dirname, 'dist/admin'), {
  maxAge: '1d', // Cache static assets for 1 day in production
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Fallback for Admin SPA routing: send index.html for any unmatched /admin/* paths
// But make it asset-aware: if requesting a file (with extension) that wasn't found, pass it to return 404
app.get('/admin/*', (req, res, next) => {
  const isFileRequest = req.path.includes('.') || req.path.includes('/assets/');
  if (isFileRequest) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist/admin/index.html'), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// Serve User app static assets
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Fallback for User SPA routing: send index.html for all other unmatched paths
// If requesting a static file with extension, immediately return 404 rather than returning index.html
app.get('*', (req, res) => {
  const isFileRequest = req.path.includes('.') || req.path.includes('/assets/');
  if (isFileRequest) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, 'dist/index.html'), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 MAGNIFIED EXISTENCE OS - PRODUCTION SERVER READY`);
  console.log(`==================================================`);
  console.log(`👉 User Application:  http://localhost:${PORT}/`);
  console.log(`👉 Admin Dashboard:   http://localhost:${PORT}/admin/`);
  console.log(`👉 Health Check:      http://localhost:${PORT}/health`);
  console.log(`==================================================`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
  
  server.close(() => {
    console.log('💤 Http server closed. Safe to terminate.');
    process.exit(0);
  });

  // If server.close takes too long, force exit
  setTimeout(() => {
    console.error('⚠️ Graceful shutdown timed out, force terminating...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
