export interface TrainArguments {
  modelType: string | null;
  gpu: boolean;
  lookBack: number;
  step: number;
  delay: number;
  normalize: true;
  includeDateTime: false;
  batchSize: number;
  epochs: number;
  earlyStoppingPatience: number;
  logDir: string;
  logUpdateFreq: string | null;
}
