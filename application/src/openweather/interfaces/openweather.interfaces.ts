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

export interface WeatherDataNormalized {
  id: string;
  date: string;
  cloud_cover: number;
  humidity: number;
  precipitation: number;
  pressure: number;
  temperature_min: number;
  temperature_max: number;
  temperature_1: number;
  temperature_2: number;
  temperature_3: number;
  temperature_4: number;
  wind: number;
}
