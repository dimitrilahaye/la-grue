const base = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/job/scrapers/',
    '<rootDir>/src/job/__tests__/deduplicator',
  ],
};
