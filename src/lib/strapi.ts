export interface StrapiFile {
  id: number;
  attributes: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// --- Content Types ---

export interface HeroData {
  title: string;
  subtitle: string;
  cta_text: string;
  background_image: {
    data: StrapiFile;
  };
}

export interface AboutData {
  title: string;
  content: string;
  image: {
    data: StrapiFile;
  };
}

export interface GalleryImage {
  image: {
    data: StrapiFile;
  };
  alt_text: string;
  category: 'wedding' | 'portrait' | 'product';
}

/**
 * Fetches data from the Strapi API
 * @param endpoint - The API endpoint (e.g. 'hero' or 'gallery-images')
 * @param query - Optional query parameters object
 * @returns The JSON response from Strapi
 */
export async function fetchStrapi<T>(
  endpoint: string,
  query?: Record<string, string>,
): Promise<T | null> {
  const baseUrl = import.meta.env.STRAPI_URL || 'http://localhost:1337';
  const url = new URL(`${baseUrl}/api/${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${import.meta.env.STRAPI_TOKEN}`, // Uncomment if using token
      },
    });

    if (!response.ok) {
      console.error(`Error fetching from Strapi (${endpoint}):`, response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Network error fetching from Strapi (${endpoint}):`, error);
    return null;
  }
}

/**
 * Helper to get the full URL of a Strapi media asset
 */
export function getStrapiMedia(url: string | null): string {
  if (!url) return '';

  // Return absolute URLs as is
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }

  // Prepend Strapi URL for relative paths
  const baseUrl = import.meta.env.STRAPI_URL || 'http://localhost:1337';
  return `${baseUrl}${url}`;
}
