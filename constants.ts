
export const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'this', 'that', 'your', 'their', 'was', 'were',
  'a', 'an', 'is', 'are', 'in', 'on', 'at', 'by', 'of', 'to', 'or'
]);

export const SITE_CONFIG = {
  [ 'shutterstock.com' ]: {
    name: 'Shutterstock',
    primaryColor: 'bg-red-600',
    itemSelector: '[data-testid="search-grid-item"]',
    tagSelector: 'a[data-testid="tag"]'
  },
  [ 'stock.adobe.com' ]: {
    name: 'Adobe Stock',
    primaryColor: 'bg-blue-700',
    itemSelector: '.search-result-cell',
    tagSelector: '.keyword-link'
  },
  [ 'freepik.com' ]: {
    name: 'Freepik',
    primaryColor: 'bg-blue-500',
    itemSelector: 'figure.show-card',
    tagSelector: '.tag-list .tag'
  }
};
