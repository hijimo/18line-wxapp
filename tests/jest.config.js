module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/agent-builder/**/*.test.js', '**/agent-reviewer/**/*.test.js'],
  testTimeout: 60000,
  reporters: [
    'default',
    ['./shared/adversarial-reporter.js', { outputDir: './reports' }],
  ],
};
