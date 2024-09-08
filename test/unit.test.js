const { return_twoDecimalPlaces } = require('../public/helper.js');

describe('Helper Function Tests', () => {
  it('should return a number with two decimal places', () => {
    const result = return_twoDecimalPlaces(123.456);
    // Rounded to two decimal places
    expect(result).toBe('123.46'); 
  });

  it('should return a number with two decimal places even if input has less than two', () => {
    const result = return_twoDecimalPlaces(123.4);
    expect(result).toBe('123.40'); 
    // Adds a zero to make two decimal places
  });

  it('should handle negative numbers correctly', () => {
    const result = return_twoDecimalPlaces(-123.456);
    // Properly formats a negative number
    expect(result).toBe('-123.46'); 
  });
});
