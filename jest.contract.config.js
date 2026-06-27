const base = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testMatch: ['**/*.contract.test.ts'],
  testTimeout: 15000,
};
