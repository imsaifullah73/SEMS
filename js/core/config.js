export const CONFIG = Object.freeze({
  APP_NAME: 'SEMS',
  APP_FULL_NAME: 'Student Expense Management System',
  VERSION: '0.4.0-phase15',

  CURRENCY: {
    CODE: 'PKR',
    SYMBOL: 'Rs.',
    LOCALE: 'en-PK',
  },

  DATE: {
    LOCALE: 'en-GB',
    DISPLAY_FORMAT: { day: '2-digit', month: 'short', year: 'numeric' },
  },

  API: {
    BASE_URL: 'http://localhost:5000/api',
  },

  STORAGE_PREFIX: 'sems_',

  THEME: {
    DEFAULT: 'light',
    STORAGE_KEY: 'sems_theme',
    ATTRIBUTE: 'data-theme',
  },

  DEBUG: true,
});