import { MercadoLibreItemExtractor } from './mercado-libre-item-extractor';
import { MercadoLibreProduct } from '../types/mercado-libre-api.types';

describe('MercadoLibreItemExtractor', () => {
  let extractor: MercadoLibreItemExtractor;

  beforeEach(() => {
    extractor = new MercadoLibreItemExtractor();
  });

  it('should extract items from catalog products', () => {
    // Arrange - Real structure from MercadoLibre /products/search API
    const products: MercadoLibreProduct[] = [
      {
        id: 'MLA49689844',
        catalog_product_id: 'MLA49689844',
        domain_id: 'MLA-CELLPHONE_CASES_AND_COVERS',
        name: 'Samsung S25 Ultra Rugged Galaxy S25 Ultra Negro',
        parent_id: 'MLA49689842',
        settings: {
          content: 'fixed',
          listing_strategy: 'open',
          exclusive: false,
        },
        children_ids: [],
        attributes: [],
        status: 'active',
        short_description: {
          type: 'plaintext',
          content: 'Test description',
        },
        pictures: [
          {
            id: '956244-MLA95677477841_102025',
            url: 'https://http2.mlstatic.com/D_NQ_NP_956244-MLA95677477841_102025-F.jpg',
            max_width: '1048',
            max_height: '1200',
          },
        ],
        authority_types: ['COMMUNITY'],
        date_created: '2025-05-12T15:04:16Z',
        last_updated: '2025-11-27T01:30:23Z',
        quality_type: 'COMPLETE',
        product_standard: true,
        search_type: 'KEYWORD',
      },
      {
        id: 'MLA53981795',
        catalog_product_id: 'MLA53981795',
        domain_id: 'MLA-STYLUSES',
        name: 'S25 Ultra S Pen Compatible Con Samsung Galaxy S25 Ultra 5g',
        parent_id: 'MLA53981794',
        settings: {
          content: 'fixed',
          listing_strategy: 'catalog_required',
          exclusive: false,
        },
        children_ids: [],
        attributes: [],
        status: 'active',
        short_description: {
          type: 'plaintext',
          content: 'Test description',
        },
        pictures: [],
        authority_types: ['COMMUNITY'],
        date_created: '2025-08-18T04:13:23Z',
        last_updated: '2026-02-07T06:54:30Z',
        quality_type: 'COMPLETE',
        product_standard: true,
        search_type: 'KEYWORD',
      },
    ];

    // Act
    const items = extractor.extractItemsFromProducts(products);

    // Assert
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('MLA49689844');
    expect(items[0].title).toBe(
      'Samsung S25 Ultra Rugged Galaxy S25 Ultra Negro',
    );
    expect(items[0].price).toBe(0); // Catalog products don't have prices
    expect(items[0].currency_id).toBe('ARS');
    expect(items[0].picture_url).toBe(
      'https://http2.mlstatic.com/D_NQ_NP_956244-MLA95677477841_102025-F.jpg',
    );
    expect(items[1].id).toBe('MLA53981795');
    expect(items[1].picture_url).toBeUndefined(); // No pictures for second product
  });

  it('should extract product name as title', () => {
    // Arrange
    const products: MercadoLibreProduct[] = [
      {
        id: 'MLA123',
        catalog_product_id: 'MLA123',
        domain_id: 'MLA-CELLPHONES',
        name: 'Samsung Galaxy S25 Ultra',
        parent_id: 'MLA122',
        settings: {
          content: 'fixed',
          listing_strategy: 'open',
          exclusive: false,
        },
        children_ids: [],
        attributes: [],
        status: 'active',
        short_description: {
          type: 'plaintext',
          content: '',
        },
        pictures: [],
        authority_types: [],
        date_created: '2025-01-01T00:00:00Z',
        last_updated: '2025-01-01T00:00:00Z',
        quality_type: 'COMPLETE',
        product_standard: true,
        search_type: 'KEYWORD',
      },
    ];

    // Act
    const items = extractor.extractItemsFromProducts(products);

    // Assert
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Samsung Galaxy S25 Ultra');
  });

  it('should use first picture URL if available', () => {
    // Arrange
    const products: MercadoLibreProduct[] = [
      {
        id: 'MLA123',
        catalog_product_id: 'MLA123',
        domain_id: 'MLA-CELLPHONES',
        name: 'Test Product',
        parent_id: 'MLA122',
        settings: {
          content: 'fixed',
          listing_strategy: 'open',
          exclusive: false,
        },
        children_ids: [],
        attributes: [],
        status: 'active',
        short_description: {
          type: 'plaintext',
          content: '',
        },
        pictures: [
          {
            id: 'pic1',
            url: 'https://example.com/image1.jpg',
            max_width: '500',
            max_height: '500',
          },
          {
            id: 'pic2',
            url: 'https://example.com/image2.jpg',
            max_width: '500',
            max_height: '500',
          },
        ],
        authority_types: [],
        date_created: '2025-01-01T00:00:00Z',
        last_updated: '2025-01-01T00:00:00Z',
        quality_type: 'COMPLETE',
        product_standard: true,
        search_type: 'KEYWORD',
      },
    ];

    // Act
    const items = extractor.extractItemsFromProducts(products);

    // Assert
    expect(items[0].picture_url).toBe('https://example.com/image1.jpg');
  });

  it('should return empty array for empty products array', () => {
    // Act
    const items = extractor.extractItemsFromProducts([]);

    // Assert
    expect(items).toHaveLength(0);
  });
});
