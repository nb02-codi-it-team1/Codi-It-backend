module.exports = {
  apps: [
    {
      name: 'codi-it',
      script: 'dist/src/server.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      out_file: '/home/ec2-user/logs/out.log',
      error_file: '/home/ec2-user/logs/error.log',
      merge_logs: true,
    },
  ],
};
