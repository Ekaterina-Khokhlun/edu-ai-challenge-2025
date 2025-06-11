// Test setup file
// Configure global test settings

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

global.beforeAll(() => {
  // Silence console.log during tests unless explicitly needed
  console.log = jest.fn();
});

global.afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Global test utilities
global.createMockPlayer = (name = 'TestPlayer', type = 'human') => {
  return {
    name,
    type,
    placeShips: jest.fn().mockResolvedValue(true),
    receiveAttack: jest.fn().mockReturnValue({ success: true, hit: false, message: 'Miss!' }),
    hasRemainingShips: jest.fn().mockReturnValue(true),
    getStatistics: jest.fn().mockReturnValue({
      totalShots: 0,
      hits: 0,
      misses: 0,
      shipsSunk: 0,
      accuracy: 0
    })
  };
};

// Extend Jest matchers if needed
expect.extend({
  toBeValidCoordinate(received) {
    const pass = received.row >= 0 && received.row < 10 && 
                 received.col >= 0 && received.col < 10;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be valid coordinates`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be valid coordinates`,
        pass: false,
      };
    }
  },
}); 