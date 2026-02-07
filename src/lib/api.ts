export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:1337/api';
export const BASE_URL = import.meta.env.PUBLIC_BASE_URL || 'http://localhost:1337';

export interface GalleryItem {
  id: number;
  title?: string;
  image_path: string;
  alt?: string;
}

export interface Gallery {
  id: number;
  category: string;
  name?: string;
  items: GalleryItem[];
}

export interface Page {
  id: number;
  slug: string;
  title?: string;
  content?: string;
  hero_image?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface Testimonial {
  id: number;
  author: string;
  content?: string;
  rating: number;
}

export interface Settings {
  site_name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
}

// Fetch helper
async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) {
      console.error(`API Error ${endpoint}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`Network Error ${endpoint}:`, error);
    return null;
  }
}

// Data methods
export const getPage = (slug: string) => fetchApi<Page>(`/pages/${slug}`);
export const getPages = () => fetchApi<Page[]>('/pages');
export const getGalleries = () => fetchApi<Gallery[]>('/galleries');
export const getTestimonials = () => fetchApi<Testimonial[]>('/testimonials');
export const getSettings = () => fetchApi<Settings>('/settings');

// Helper to get full image URL
export const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
