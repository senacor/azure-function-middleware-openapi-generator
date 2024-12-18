module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/integration-test/'],
    moduleDirectories: ['node_modules'],
};
