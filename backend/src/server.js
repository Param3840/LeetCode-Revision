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
  
  let currentPort = PORT;
  
  const listen = () => {
    const server = app.listen(currentPort, () => {
      console.log(`🚀 Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${currentPort}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[CodeRevise] Port ${currentPort} is already in use. Retrying on port ${currentPort + 1}...`);
        currentPort++;
        try {
          server.close();
        } catch (closeErr) {
          // Ignore close errors on unbound sockets
        }
        listen();
      } else {
        console.error('[CodeRevise] Server error:', err);
      }
    });
  };

  listen();
};

startServer();
