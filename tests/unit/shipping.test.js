const { ShippingService } = require('../../sut-b/src/service');
const demo = require('../../.ci/demo.json');
const service = new ShippingService({}, {}, {}, { isAllowed: async () => true });
test.each([[1000, 100, 7000], [1001, 100, 8000], [1, 1, 6010], [30000, 5000, 85000]])(
  'base fee: %i g, %i km => %i kopecks', (weight, distance, fee) => {
    expect(service.calculateBaseFee(weight, distance)).toBe(fee);
  });
test.each([[0, 0], [10000, 200], [99, 1], [2500000, 50000], [3000000, 50000]])(
  'insurance: declared %i => fee %i', (value, fee) => expect(service.calculateInsuranceFee(value)).toBe(fee));
test.each([0, 30001, 1.5])('invalid weight %s rejected', weight => {
  expect(() => service.calculateBaseFee(weight, 100)).toThrow();
});
test('cancellation refunds saved total', () => expect(service.calculateRefund(7200)).toBe(7200));
test('DEMO: incorrect expectation fails CI without suppressing the error', () => {
  const forceFailure = demo.forceFailure || process.env.CI_FORCE_FAILURE === '1';
  expect(service.calculateBaseFee(1000, 100)).toBe(forceFailure ? 7001 : 7000);
});
