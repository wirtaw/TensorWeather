export interface AppConfig {
  version: string;
  env: Environment;
  port: number;
  socketPort: number;
  logLevels: { [key: string]: number };
  enabledOrigins: string[];
  requestTimeoutSeconds: number;
  responseTimeoutSeconds: number;
  cacheTTL: number;
}

enum Environment {
  Workspace = 'workspace',
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export const currentEnvironment = (): Environment => {
  return (
    Environment[
      Object.keys(Environment).find(
        (key) => Environment[key] === process.env.NODE_ENV,
      )
    ] || Environment.Workspace
  );
};

export const logLevels = (): AppConfig['logLevels'] => {
  const levels: { [key: string]: number } = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };
  const logLevelList: string[] = ['info', 'debug', 'error', 'http', 'warn'];

  const disabledLogLevels =
    (process.env.APP_DISABLED_LOGGER_LEVELS &&
      process.env.APP_DISABLED_LOGGER_LEVELS.split(',')) ||
    [];
  const filteredLevels: string[] = logLevelList.filter(
    (logLevel) => !disabledLogLevels.includes(logLevel),
  );
  const allowedLevels: { [key: string]: number } = {};

  for (const levelKey of filteredLevels) {
    allowedLevels[levelKey] = levels[levelKey];
  }

  return allowedLevels;
};

export const enabledOrigins = (): AppConfig['enabledOrigins'] => {
  return (
    (process.env.APP_ENABLED_ORIGINS &&
      process.env.APP_ENABLED_ORIGINS.split(',')) ||
    []
  );
};

export default (): AppConfig => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  socketPort: parseInt(process.env.SOCKET_PORT, 10) || 3001,
  env: currentEnvironment(),
  version: process.env.VERSION,
  logLevels: logLevels(),
  enabledOrigins: enabledOrigins(),
  requestTimeoutSeconds:
    parseInt(process.env.APP_REQUEST_TIMEOUT_SECONDS, 10) || 10000,
  responseTimeoutSeconds:
    parseInt(process.env.APP_RESPONSE_TIMEOUT_SECONDS, 10) || 10000,
  cacheTTL: parseInt(process.env.CACHE_TTL, 10) || 10000,
});
