module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  verbose: true,
  moduleDirectories: ["node_modules"],
  setupFilesAfterEnv: ["jest-allure/dist/setup", "./setupAllure.js"],
  transformIgnorePatterns: ["node_modules"],
  transform: {
    "^.+\\.(js|ts)$": ["babel-jest"],
  },
  coverageDirectory: `reports/coverage`,
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*-cli-module.ts",
    "!src/package-cli.ts",
  ],
  coveragePathIgnorePatterns: ["__test__", "__tests__"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: `reports/test_reports`,
        outputName: `jest-junit.xml`,
      },
    ],
    "jest-allure",
  ],
  maxWorkers: "50%",
  // As of Jest 27, the default has changed from 'jasmine' to 'jest-circus/runner'. However, this project uses jest-allure,
  // which is dependent on the jasmine test runner
  testRunner: "jest-jasmine2",
  setupFiles: ["./jest-setup.js"],
};
