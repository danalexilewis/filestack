import { getProduct } from './product';

describe('getProduct', () => {
  it('should return a product for a valid id', () => {
    const product = getProduct('1');
    expect(product).not.toBeNull();
    expect(product?.name).toBe('Test Product');
  });

  it('should return null for an invalid id', () => {
    const product = getProduct('2');
    expect(product).toBeNull();
  });
});
