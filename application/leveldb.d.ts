declare module 'leveldb' {
    interface LevelDB {
      put(key: string, value: any): Promise<void>;
      get(key: string): Promise<any>;
      // Add other methods you use
    }
  }