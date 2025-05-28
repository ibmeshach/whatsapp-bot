export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  colors: string[];
  price: number;
  description: string;
  sizes?: string[];
  material?: string;
  careInstructions?: string;
}

export interface AseobiType {
  id: string;
  name: string;
  description: string;
  products: Product[];
}

export const aseobiTypes: AseobiType[] = [
  {
    id: 'traditional',
    name: 'Traditional Aseobi',
    description: 'Classic Nigerian traditional wear with modern touches',
    products: [
      {
        id: 'trad-001',
        name: 'Royal Ankara Gown',
        imageUrl:
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1',
        colors: ['Blue', 'Gold', 'Red'],
        price: 45000,
        description: 'Elegant traditional gown with intricate patterns',
        sizes: ['S', 'M', 'L', 'XL'],
        material: 'Premium Ankara',
        careInstructions: 'Dry clean only',
      },
      {
        id: 'trad-002',
        name: 'Modern Agbada',
        imageUrl:
          'https://images.unsplash.com/photo-1591369822096-ffd140ec948f',
        colors: ['White', 'Black', 'Green'],
        price: 55000,
        description: 'Contemporary take on the classic Agbada',
        sizes: ['M', 'L', 'XL', 'XXL'],
        material: 'Cotton blend',
      },
    ],
  },
  {
    id: 'casual',
    name: 'Casual Aseobi',
    description: 'Comfortable everyday wear with African prints',
    products: [
      {
        id: 'cas-001',
        name: 'Print Maxi Dress',
        imageUrl:
          'https://images.unsplash.com/photo-1572804013427-4d7ca7268217',
        colors: ['Yellow', 'Orange', 'Brown'],
        price: 25000,
        description: 'Light and flowy maxi dress perfect for casual outings',
        sizes: ['S', 'M', 'L'],
        material: 'Cotton',
        careInstructions: 'Machine wash cold',
      },
      {
        id: 'cas-002',
        name: 'African Print Shirt',
        imageUrl:
          'https://images.unsplash.com/photo-1591369822096-ffd140ec948f',
        colors: ['Blue', 'Red', 'Green'],
        price: 15000,
        description: 'Comfortable shirt with traditional patterns',
        sizes: ['S', 'M', 'L', 'XL'],
        material: 'Cotton blend',
      },
    ],
  },
  {
    id: 'formal',
    name: 'Formal Aseobi',
    description: 'Professional wear with African influence',
    products: [
      {
        id: 'for-001',
        name: 'Executive Suit',
        imageUrl:
          'https://images.unsplash.com/photo-1591369822096-ffd140ec948f',
        colors: ['Black', 'Navy', 'Grey'],
        price: 75000,
        description: 'Professional suit with subtle African patterns',
        sizes: ['S', 'M', 'L', 'XL'],
        material: 'Wool blend',
        careInstructions: 'Dry clean only',
      },
      {
        id: 'for-002',
        name: 'Business Dress',
        imageUrl:
          'https://images.unsplash.com/photo-1572804013427-4d7ca7268217',
        colors: ['Black', 'Navy', 'Burgundy'],
        price: 35000,
        description: 'Elegant business dress with African print accents',
        sizes: ['S', 'M', 'L'],
        material: 'Polyester blend',
      },
    ],
  },
];
