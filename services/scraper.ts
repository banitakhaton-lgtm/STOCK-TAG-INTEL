
import { ScrapedItem, TagResult, MicrostockSite } from '../types';
import { STOP_WORDS, SITE_CONFIG } from '../constants';

/**
 * Performs actual DOM scraping based on the current site configuration.
 */
export const scrapeLivePage = (site: MicrostockSite): ScrapedItem[] => {
  const config = SITE_CONFIG[site as keyof typeof SITE_CONFIG];
  if (!config) return [];

  const items: ScrapedItem[] = [];
  const itemElements = document.querySelectorAll(config.itemSelector);

  itemElements.forEach((el, index) => {
    // In some sites, tags might be inside the item element, in others they might be elsewhere.
    // We attempt to find tags within the item first, then globally if needed (though usually they are per item).
    const tagElements = el.querySelectorAll(config.tagSelector);
    const tags: string[] = [];
    
    tagElements.forEach(tagEl => {
      const text = tagEl.textContent?.trim();
      if (text) tags.push(text);
    });

    // If no tags found in item (common in search grids), we might rely on titles or other attributes
    // but the PRD specifically asks for tag scraping.
    items.push({
      id: `scraped-item-${index}`,
      title: el.getAttribute('aria-label') || el.querySelector('img')?.getAttribute('alt') || `Item ${index + 1}`,
      tags: tags,
      position: index + 1
    });
  });

  return items;
};

export const processTags = (items: ScrapedItem[]): TagResult[] => {
  const tagStats: Record<string, { count: number; weight: number }> = {};

  items.forEach(item => {
    item.tags.forEach(tag => {
      const cleanTag = tag.toLowerCase().trim().replace(/[.,#!$%^&*;:{}=\-_`~()]/g, "");
      
      // Filter logic: ignore stop words and words < 3 chars
      if (STOP_WORDS.has(cleanTag) || cleanTag.length < 3) return;

      if (!tagStats[cleanTag]) {
        tagStats[cleanTag] = { count: 0, weight: 0 };
      }

      tagStats[cleanTag].count += 1;

      // Position Weight logic:
      // 1-10: +5 points
      // 11-20: +3 points
      // 21+: +1 point
      let weight = 1;
      if (item.position <= 10) weight = 5;
      else if (item.position <= 20) weight = 3;

      tagStats[cleanTag].weight += weight;
    });
  });

  const results: TagResult[] = Object.entries(tagStats).map(([tag, stats]) => ({
    tag,
    frequency: stats.count,
    score: stats.weight + (stats.count * 2) 
  }));

  return results.sort((a, b) => b.score - a.score).slice(0, 30);
};
