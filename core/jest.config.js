const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!cheerio|cheerio-select|css-select|css-what|domhandler|domutils|htmlparser2|ts-dedent).+\\.js$',
  ],
  preset: 'ts-jest',
}

module.exports = createJestConfig(customJestConfig)
