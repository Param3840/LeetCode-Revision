const dns = require('dns');
const dotenv = require('dotenv');

// Load environment variables immediately
dotenv.config();

// Configure Node's internal DNS resolver to use public DNS servers (Google/Cloudflare)
// to resolve SRV records successfully, bypassing local DNS server querySrv ECONNREFUSED issues
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('[CodeRevise] Node.js DNS servers configured to Google/Cloudflare public DNS.');
} catch (e) {
  console.warn('[CodeRevise] Warning: Failed to set custom DNS servers:', e.message);
}

const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

// Connect to Database and start server
const startServer = async () => {
  await connectDB();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('\n--------------------------------------------------');
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error('Another process is already using this port.');
      console.error('To identify the process on Windows:');
      console.error(`  netstat -ano | findstr :${PORT}`);
      console.error('To terminate it:');
      console.error('  taskkill /PID <PID> /F');
      console.error('After stopping the process, restart the backend.');
      console.error('--------------------------------------------------\n');
      process.exit(1);
    } else {
      console.error('❌ Server startup error:', err.message);
      process.exit(1);
    }
  });
};

startServer();
