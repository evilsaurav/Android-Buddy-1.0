/**
 * PM2 Configuration for Azure App Service
 * Used when PM2 is available on the App Service plan
 */
module.exports = {
  apps: [
    {
      name: 'bcabuddy',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '256M',
      error_file: '/home/LogFiles/pm2-error.log',
      out_file: '/home/LogFiles/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
