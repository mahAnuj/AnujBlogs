module.exports = {
  apps: [{
    name: 'anujblog-backend',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader ts-node/esm -r tsconfig-paths/register -r dotenv/config',
    env: {
      NODE_ENV: 'production',
      SERVE_STATIC: 'false',
      TS_NODE_TRANSPILE_ONLY: 'true',
      DATABASE_URL: process.env.DATABASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PORT: process.env.PORT || 3000
    }
  }]
};
