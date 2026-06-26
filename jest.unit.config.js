const base = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  setupFiles: ['<rootDir>/jest.setup.unit.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/job/scrapers/',
    '<rootDir>/src/job/__tests__/deduplicator',
  ],
};
