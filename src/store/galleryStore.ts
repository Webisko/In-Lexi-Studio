import { atom } from 'nanostores';

export type GalleryCategory = 'wedding' | 'portrait' | 'product';

export const currentCategory = atom<GalleryCategory>('wedding');

export const setCategory = (category: GalleryCategory) => {
  currentCategory.set(category);
};
