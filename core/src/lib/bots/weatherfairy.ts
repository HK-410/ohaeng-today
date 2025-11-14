import axios from 'axios';
import { TwitterClient, parseTwitterCredentials } from '@hakyung/x-bot-toolkit';

interface ForecastResponseData {
  list: Array<{dt: number, main: {temp_min: number, temp_max: number}, weather: Array<{description: string}>}>
}

interface WeatherData {
  temp: {
    min: undefined | number,
    max: undefined | number,
  },
  weather: undefined | string,
}

const WEATHER_DICTIONARY: {[key: string]: {
  importance: number,
  icon: string,
}} = {
  "clear sky": {
      importance: 0,
      icon: "☀️",
  },
  "few clouds": {
      importance: 1,
      icon: "🌤",
  },
  "scattered clouds": {
      importance: 2,
      icon: "⛅",
  },
  "broken clouds": {
      importance: 3,
      icon: "🌥",
  },
  "mist": {
      importance: 4,
      icon: "🌫",
  },
  "shower rain": {
      importance: 5,
      icon: "🌦",
  },
  "rain": {
      importance: 6,
      icon: "🌧",
  },
  "thunderstorm": {
      importance: 7,
      icon: "⛈️",
  },
  "snow": {
      importance: 8,
      icon: "☃️",
  }
}

export async function runWeatherfairyBot(isDryRun: boolean) {
  const runIdentifier = Math.random().toString(36).substring(7);
  console.log(`[weatherfairy-${runIdentifier}] Function start. dryRun=${isDryRun}`);

  // 1. Initialize Clients
  const twitterClient = new TwitterClient(parseTwitterCredentials(process.env.X_CREDENTIALS_WEATHERFAIRY!));
  console.log(`[weatherfairy-${runIdentifier}] Clients initialized.`);

  // 2. Get weather data
  const kstTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  const kstDate = new Date(kstTime);
  const today = kstDate.getUTCDate();
  const fullDateString = `${kstDate.getUTCFullYear()}년 ${kstDate.getUTCMonth() + 1}월 ${kstDate.getUTCDate()}일`;

  const weatherData: {[key: string]: WeatherData} = {
    seoul: {
      temp: {
        min: undefined,
        max: undefined,
      },
      weather: undefined,
    },
    busan: {
      temp: {
        min: undefined,
        max: undefined,
      },
      weather: undefined,
    },
    pyongyang: {
      temp: {
        min: undefined,
        max: undefined,
      },
      weather: undefined,
    },
  }

  console.log(`[weatherfairy-${runIdentifier}] Attempting to fetch weather from OpenWeatherMap`);
  try {
    const headers = { 
      'User-Agent': 'WeatherFairyBot/1.0 (https://github.com/HK-410/hakyng-bots/tree/main/apps/weatherfairy/; hakyung410+weatherfairy@gmail.com)' 
    };
    const seoulResponse = await axios.get(`http://api.openweathermap.org/data/2.5/forecast?q=Seoul&appid=${process.env.OPENWEATHERMAP_API_KEY}&lang=en&units=metric`, { headers });
    const seoulForecast: ForecastResponseData = seoulResponse.data;
    for (const forecast of seoulForecast.list) {
      const forecastTimeInKST = new Date(new Date(forecast.dt * 1000).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      if (forecastTimeInKST.getUTCDate() !== today) continue;
      if (!weatherData.seoul.temp.min || forecast.main.temp_min < weatherData.seoul.temp.min) weatherData.seoul.temp.min = forecast.main.temp_min;
      if (!weatherData.seoul.temp.max || weatherData.seoul.temp.max < forecast.main.temp_max) weatherData.seoul.temp.max = forecast.main.temp_max;
      for (const weatherInForecast of forecast.weather) {
        if (WEATHER_DICTIONARY[weatherInForecast.description]&& (!weatherData.seoul.weather || WEATHER_DICTIONARY[weatherData.seoul.weather].importance < WEATHER_DICTIONARY[weatherInForecast.description].importance)) weatherData.seoul.weather = weatherInForecast.description;
      }
    }
    const busanResponse = await axios.get(`http://api.openweathermap.org/data/2.5/forecast?q=Busan&appid=${process.env.OPENWEATHERMAP_API_KEY}&lang=en&units=metric`, { headers });
    const busanForecast: ForecastResponseData = busanResponse.data;
    for (const forecast of busanForecast.list) {
      const forecastTimeInKST = new Date(new Date(forecast.dt * 1000).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      if (forecastTimeInKST.getUTCDate() !== today) continue;
      if (!weatherData.busan.temp.min || forecast.main.temp_min < weatherData.busan.temp.min) weatherData.busan.temp.min = forecast.main.temp_min;
      if (!weatherData.busan.temp.max || weatherData.busan.temp.max < forecast.main.temp_max) weatherData.busan.temp.max = forecast.main.temp_max;
      for (const weatherInForecast of forecast.weather) {
        if (WEATHER_DICTIONARY[weatherInForecast.description]&& (!weatherData.busan.weather || WEATHER_DICTIONARY[weatherData.busan.weather].importance < WEATHER_DICTIONARY[weatherInForecast.description].importance)) weatherData.busan.weather = weatherInForecast.description;
      }
    }
    const pyongyangResponse = await axios.get(`http://api.openweathermap.org/data/2.5/forecast?q=Pyongyang&appid=${process.env.OPENWEATHERMAP_API_KEY}&lang=en&units=metric`, { headers });
    const pyongyangForecast: ForecastResponseData = pyongyangResponse.data;
    for (const forecast of pyongyangForecast.list) {
      const forecastTimeInKST = new Date(new Date(forecast.dt * 1000).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      if (forecastTimeInKST.getUTCDate() !== today) continue;
      if (!weatherData.pyongyang.temp.min || forecast.main.temp_min < weatherData.pyongyang.temp.min) weatherData.pyongyang.temp.min = forecast.main.temp_min;
      if (!weatherData.pyongyang.temp.max || weatherData.pyongyang.temp.max < forecast.main.temp_max) weatherData.pyongyang.temp.max = forecast.main.temp_max;
      for (const weatherInForecast of forecast.weather) {
        if (WEATHER_DICTIONARY[weatherInForecast.description]&& (!weatherData.pyongyang.weather || WEATHER_DICTIONARY[weatherData.pyongyang.weather].importance < WEATHER_DICTIONARY[weatherInForecast.description].importance)) weatherData.pyongyang.weather = weatherInForecast.description;
      }
    }
  } catch (apiError) {
    console.error(`[weatherfairy-${runIdentifier}] OpenWeatherMap API fetch failed:`, apiError);
  }

  // 3. Generate tweet content
  const tweetContent = `${fullDateString}
서울 ${weatherData.seoul.weather ? WEATHER_DICTIONARY[weatherData.seoul.weather].icon : "❓"} - 최고: ${undefined !== weatherData.seoul.temp.max ? Math.round(weatherData.seoul.temp.max) : "❓"}℃ | 최저: ${undefined !== weatherData.seoul.temp.min ? Math.round(weatherData.seoul.temp.min) : "❓"}℃
부산 ${weatherData.busan.weather ? WEATHER_DICTIONARY[weatherData.busan.weather].icon : "❓"} - 최고: ${undefined !== weatherData.busan.temp.max ? Math.round(weatherData.busan.temp.max) : "❓"}℃ | 최저: ${undefined !== weatherData.busan.temp.min ? Math.round(weatherData.busan.temp.min) : "❓"}℃
평양 ${weatherData.pyongyang.weather ? WEATHER_DICTIONARY[weatherData.pyongyang.weather].icon : "❓"} - 최고: ${undefined !== weatherData.pyongyang.temp.max ? Math.round(weatherData.pyongyang.temp.max) : "❓"}℃ | 최저: ${undefined !== weatherData.pyongyang.temp.min ? Math.round(weatherData.pyongyang.temp.min) : "❓"}℃`;

  // 4. Post to Twitter (or log for dry run)
  if (isDryRun) {
    console.log(`[weatherfairy-${runIdentifier}] --- DRY RUN ---`);
    console.log(`[weatherfairy-${runIdentifier}] Tweet content (${twitterClient.calculateBytes(tweetContent)} bytes):`);
    console.log(tweetContent);
  } else {
    console.log(`[weatherfairy-${runIdentifier}] Posting tweet...`);
    await twitterClient.postTweet(tweetContent);
    console.log(`[weatherfairy-${runIdentifier}] Successfully posted tweet.`);
  }

  return {
    success: true,
    dryRun: isDryRun,
    tweet: tweetContent,
  };
}
