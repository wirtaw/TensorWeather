import appConfig, { AppConfig, currentEnvironment } from './app/app.config';
import dbConfig, { DbConfig } from './database/database.config';

export interface Config {
  app: AppConfig;
  db: DbConfig;
}

export const getEnvFilePaths = () => {
  const environment = currentEnvironment();
  return [
    `.env.${environment}.local`,
    '.env.local',
    `.env.${environment}`,
    '.env',
  ];
};

export default (): Config => ({
  app: appConfig(),
  db: dbConfig(),
});
