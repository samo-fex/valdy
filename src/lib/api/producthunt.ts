interface ProductHuntProduct {
  id: string;
  name: string;
  tagline: string;
  votesCount: number;
  website: string;
  url: string;
}

interface ProductHuntResponse {
  data: {
    posts: {
      edges: Array<{
        node: ProductHuntProduct;
      }>;
    };
  };
}

export class ProductHuntClient {
  private token: string;
  private endpoint = 'https://api.producthunt.com/v2/api/graphql';

  constructor(token: string) {
    this.token = token;
  }

  async searchProducts(query: string): Promise<ProductHuntProduct[]> {
    const graphqlQuery = `
      query {
        posts(first: 20, order: VOTES) {
          edges {
            node {
              id
              name
              tagline
              votesCount
              website
              url
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ProductHunt] API error ${response.status}:`, errorText);
        throw new Error(`Product Hunt API error: ${response.status}`);
      }

      const data: ProductHuntResponse = await response.json();
      
      console.log('[ProductHunt] Raw response:', JSON.stringify(data).substring(0, 200));
      
      if (data.data?.posts?.edges) {
        const allProducts = data.data.posts.edges.map(edge => edge.node);
        console.log(`[ProductHunt] Total products from API: ${allProducts.length}`);
        
        // Client-side filtering by query keywords (keep keywords 2+ chars)
        const keywords = query.toLowerCase().split(' ').filter(k => k.length >= 2);
        
        if (keywords.length === 0) {
          // No valid keywords, return all products
          return allProducts.slice(0, 10);
        }
        
        const filtered = allProducts.filter(product => {
          const searchText = `${product.name} ${product.tagline}`.toLowerCase();
          return keywords.some(keyword => searchText.includes(keyword));
        });
        
        console.log(`[ProductHunt] Found ${filtered.length} products matching "${query}" (keywords: ${keywords.join(', ')})`);
        return filtered.slice(0, 10); // Return max 10 products
      }
      
      console.log('[ProductHunt] No posts.edges in response');
      return [];
    } catch (error) {
      console.error('[ProductHunt] Search error:', error);
      return [];
    }
  }
}

// Factory function to get client with token from env
export function getProductHuntClient(): ProductHuntClient | null {
  const token = process.env.PRODUCTHUNT_TOKEN;
  console.log('[ProductHunt] Token configured:', !!token, 'Length:', token?.length);
  if (!token) {
    console.warn('[ProductHunt] No token configured');
    return null;
  }
  return new ProductHuntClient(token);
}
