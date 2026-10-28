export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.jsx'],
  transform: { '^.+\\.jsx$': ['babel-jest', { presets: [['@babel/preset-react', { runtime: 'automatic' }]] }] },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  verbose: true,
};
