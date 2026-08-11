/**
 * Application Entry Point
 * Initializes HTTP server, tests database connectivity, and handles process lifecycle events gracefully.
 */

const app = require('./app');
const db = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 3000;

/**
 * Verify Database Connection and Start HTTP Server
 */
const startServer = async () => {
  try {
    // Verify MySQL pool connection before listening
    const connection = await db.getConnection();
    console.log('✅ Database connection test successful.');
    connection.release();

    // Start Express Server
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Pondicherry University NSS Portal Running`);
      console.log(`🌐 Server active on: http://localhost:${PORT}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('====================================================');
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      server.close(() => process.exit(1));
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      process.exit(1);
    });

    // Handle Graceful Termination (SIGTERM / SIGINT)
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('🔒 Express HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error.message);
    process.exit(1);
  }
};

startServer();