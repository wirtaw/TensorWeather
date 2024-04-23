export interface ProcessingOptions {
  startDate: Date;
  endDate: Date;
  lat: number;
  lon: number;
  interval?: 'daily' | 'monthly';
  monthlyDays?: number[];
  months?: number[];
}
