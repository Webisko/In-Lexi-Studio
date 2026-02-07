export interface NavItem {
  label: string;
  href: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  span?: string; // Tailwind class for grid span
}

export interface AccordionItem {
  question: string;
  answer: string;
}
