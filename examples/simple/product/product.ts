export interface Product {
  id: string;
  name: string;
  price: number;
}

export function getProduct(id: string): Product | null {
  // In a real application, you would fetch this from a database
  if (id === '1') {
    return {
      id: '1',
      name: 'Test Product',
      price: 99.99,
    };
  }
  return null;
}
