import { Platform } from 'react-native';

export const APP_CONFIG = {
  APP_NAME: 'BhukkadVerse',
  TAGLINE: 'Your Cravings. Your Universe.',
  OFFICIAL_EMAIL: 'bhukkadverse.teams@gmail.com',
  
  // Platform Economics (Enforced 4-way fair economics)
  PLATFORM_FEE: 5.0,
  FREE_DELIVERY_THRESHOLD: 99.0,
  STANDARD_DELIVERY_FEE: 25.0,
  GST_RATE: 0.05,
  VENDOR_SHARE_RATE: 0.9,
  RIDER_WAGE_PER_DELIVERY: 35.0,
  MAX_RIDER_COD_CASH_FLOAT: 1500.0,
  
  // Default API Host:
  // Android Emulator: 10.0.2.2 points to host machine
  // iOS Simulator / Web: localhost
  DEFAULT_API_BASE: Platform.select({
    android: 'http://10.0.2.2:8000/api/v1',
    ios: 'http://localhost:8000/api/v1',
    default: 'http://127.0.0.1:8000/api/v1',
  }),
};
