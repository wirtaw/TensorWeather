export interface DbConfig {
  path: string;
}

export default (): DbConfig => ({
  path: process.env.LEVELDB_PATH || '',
});
