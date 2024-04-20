module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules'],
  transformIgnorePatterns: ['node_modules'],
  transform: {
    '^.+\\.(js|ts)$': ['babel-jest'],
  },
  coverageDirectory: 'reports/coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*-cli-module.ts',
    '!src/package-cli.ts',
  ],
  coveragePathIgnorePatterns: ['__test__', '__tests__'],
  maxWorkers: '50%',
};
