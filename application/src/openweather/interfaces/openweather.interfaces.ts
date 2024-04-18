export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  id: string;  
  lat: number;
  lon: number;
  tz: string;
  date: string;
  units: string;
  cloud_cover: {
    afternoon: number;
  };
  humidity: {
    afternoon: number;
  };
  precipitation: {
    total: number;
  };
  pressure: {
    afternoon: number;
  };
  temperature: {
    min: number;
    max: number;
    afternoon: number;
    night: number;
    evening: number;
    morning: number;
  };
  wind: {
    max: {
      speed: number;
      direction: number;
    };
  };
}
