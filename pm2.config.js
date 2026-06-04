module.exports = {
  apps: [
    {
      name: "kalota-family-portal",
      script: "./src/index.js",
      cwd: "/home/ubuntu/kalota-family-portal",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};