module.exports = {
  apps: [
    {
      name: "backend-api",
      script: "dist/index.js",
      instances: "max", // 使用所有CPU核心，也可以设置具体数字如 2
      exec_mode: "cluster", // 集群模式

      // 环境配置
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },

      // 日志配置
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // 进程管理
      autorestart: true,
      watch: false, // 生产环境建议关闭文件监听
      max_memory_restart: "1G", // 内存超过1G时重启

      // 启动配置
      min_uptime: "10s", // 最小运行时间
      max_restarts: 10, // 最大重启次数
      restart_delay: 4000, // 重启延迟

      // 健康检查
      kill_timeout: 5000, // 强制杀死进程的超时时间
      listen_timeout: 3000, // 监听超时时间

      // 其他配置
      merge_logs: true, // 合并日志
      time: true, // 日志时间戳

      // 环境变量文件
      env_file: ".env",

      // 错误处理
      ignore_watch: ["node_modules", "logs", "uploads", ".git"],
    },
  ],
};
