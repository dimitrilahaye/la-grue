jest.mock('dotenv/config', () => ({}));

describe('db lazy client', () => {
  const savedUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (savedUrl !== undefined) {
      process.env.DATABASE_URL = savedUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    jest.resetModules();
  });

  it('importing db without DATABASE_URL does not throw', () => {
    delete process.env.DATABASE_URL;
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../client');
      });
    }).not.toThrow();
  });

  it('accessing a property on db without DATABASE_URL throws "DATABASE_URL is required"', () => {
    delete process.env.DATABASE_URL;
    jest.isolateModules(() => {
       
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { db } = require('../client') as { db: Record<string, unknown> };
      expect(() => {
        void db['execute'];
      }).toThrow('DATABASE_URL is required');
    });
  });
});
