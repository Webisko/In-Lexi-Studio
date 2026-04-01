const DEV_API_URL = 'http://localhost:1337/api';

const normalizeBaseUrl = (value?: string) => (value ? value.replace(/\/+$/, '') : '');

export const API_URL =
  import.meta.env.PUBLIC_API_URL || (typeof window === 'undefined' ? DEV_API_URL : '/app/api');
export const BASE_URL = normalizeBaseUrl(import.meta.env.PUBLIC_BASE_URL || '');

const UPLOADS_URL = `${BASE_URL || ''}/uploads`;

const toUploadsUrl = (path: string, search = '') => {
  const trimmed = path.replace(/^\/?(?:app\/)?uploads\//i, '');
  return `${UPLOADS_URL}/${trimmed}`;
};

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
  short_description?: string | null;
  cover_image?: string | null;
  testimonial?: Testimonial | null;
  items: GalleryItem[];
}

export interface Page {
  id: number;
  slug: string;
  updated_at?: string;
  title?: string;
  content?: string;
  hero_image?: string;
  home_hero_logo?: string | null;
  logo_variant?: 'primary' | 'secondary' | null;
  home_gallery_wedding_id?: number | null;
  home_gallery_portrait_id?: number | null;
  home_gallery_product_id?: number | null;
  home_gallery_wedding_images?: string[] | null;
  home_gallery_portrait_images?: string[] | null;
  home_gallery_product_images?: string[] | null;
  home_moments_image?: string | null;
  home_latest_moments_bg?: string | null;
  home_latest_gallery_ids?: number[] | null;
  home_testimonial_ids?: number[] | null;
  wedding_testimonial_ids?: number[] | null;
  faq_items?: Array<{ question: string; answer: string }> | null;
  wedding_slider_images?: string[] | null;
  wedding_session_types?: Array<{
    title: string;
    description: string;
    image: string;
    items?: string[];
  }> | null;
  portfolio_gallery_ids?: string[] | number[] | null;
  about_origin_images?: string[] | null;
  about_story_images?: string[] | null;
  about_story_captions?: string[] | null;
  about_work_images?: string[] | null;
  approach_gallery_images?: string[] | null;
  approach_feature_image?: string | null;
  meta_title?: string;
  meta_description?: string;
  seo_image?: string;
}

export interface Testimonial {
  id: number;
  author: string;
  content?: string;
  rating: number;
  avatar_image?: string;
}

export interface Settings {
  site_name?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  favicon?: string;
  canonical_base_url?: string;
  head_html?: string;
  body_html?: string;
  cta_text?: string;
  cta_url?: string;
  footer_text?: string;
  privacy_url?: string;
  logo_path?: string;
  logo_secondary_path?: string;
  mega_menu_image?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  umami_script_url?: string;
  umami_website_id?: string;
  umami_domains?: string;
  umami_dashboard_url?: string;
}

export interface MediaFile {
  name: string;
  url: string;
  tag: 'wedding' | 'portrait' | 'product' | 'utility' | 'other';
  title_text?: string | null;
  alt_text?: string | null;
}

// Fetch helper
type FetchOptions = {
  required?: boolean;
};

const inflightRequests = new Map<string, Promise<unknown>>();

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T | null> {
  const url = `${API_URL}${endpoint}`;
  const shouldShareRequest = typeof window !== 'undefined';

  if (shouldShareRequest && inflightRequests.has(url)) {
    return (await inflightRequests.get(url)) as T | null;
  }

  const request = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      const message = `API Error ${endpoint}: ${res.status}`;
      if (options.required) {
        throw new Error(message);
      }
      console.error(message);
      return null;
    }
    return await res.json();
  })();

  if (shouldShareRequest) {
    inflightRequests.set(url, request);
  }

  try {
    return (await request) as T | null;
  } catch (error) {
    if (options.required) {
      throw error;
    }
    console.error(`Network Error ${endpoint}:`, error);
    return null;
  } finally {
    if (shouldShareRequest) {
      inflightRequests.delete(url);
    }
  }
}

// Data methods
export const getPage = (slug: string) => fetchApi<Page>(`/pages/${slug}`);
export const getHomePage = () => fetchApi<Page>('/pages/home');
export const getPages = () => fetchApi<Page[]>('/pages');
export const getPagesRequired = () => fetchApi<Page[]>('/pages', { required: true });
export const getGalleries = () => fetchApi<Gallery[]>('/galleries');
export const getTestimonials = () => fetchApi<Testimonial[]>('/testimonials');
export const getSettings = () => fetchApi<Settings>('/settings');
export const getMediaFiles = () => fetchApi<MediaFile[]>('/media');

// Helper to get full image URL
export const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) {
    try {
      const parsedUrl = new URL(path);
      if (/^\/?(?:app\/)?uploads\//i.test(parsedUrl.pathname)) {
        return toUploadsUrl(parsedUrl.pathname, parsedUrl.search);
      }
    } catch {
      return path.replace(/\/app\/uploads\//i, '/uploads/');
    }
    return path;
  }
  if (/^\/?app\/uploads\//i.test(path)) {
    return toUploadsUrl(path);
  }
  if (/^\/?uploads\//i.test(path)) {
    return toUploadsUrl(path);
  }
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const IMAGE_VARIANT_WIDTHS = [160, 480, 960, 1440, 1920];

const addVariantSuffix = (url: string, width: number) =>
  url.replace(/\.webp(\?.*)?$/i, `-w${width}.webp$1`);

export const getImageSrcSet = (path?: string, widths: number[] = IMAGE_VARIANT_WIDTHS) => {
  if (!path) return '';
  if (!/\/uploads\//i.test(path)) return '';
  const url = getImageUrl(path);
  if (!/\.webp(\?.*)?$/i.test(url)) return '';
  return widths.map((width) => `${addVariantSuffix(url, width)} ${width}w`).join(', ');
};

export const getImageSizes = (
  preset: 'hero' | 'gallery' | 'half' | 'content' | 'portfolio' = 'content',
) => {
  switch (preset) {
    case 'hero':
      return '100vw';
    case 'gallery':
      return '(max-width: 639px) 80vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw';
    case 'portfolio':
      // masonry grid: 1 col mobile, 2 col md, 3 col lg
      return '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw';
    case 'half':
      return '(max-width: 767px) 100vw, 50vw';
    case 'content':
    default:
      return '(max-width: 1023px) 100vw, 900px';
  }
};
