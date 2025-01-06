import type { BlockPattern } from "./types";

// Basic patterns for checking promotional content
export const ADULT_CONTENT_PATTERN =
  /(onlyfans\.com|fansly\.com|😘|😈|🔥|italian\s*d|watch.*big|click.*watch)/i;
export const PROMO_LINK_PATTERN =
  /(onlyfans\.com|getallmyl?inks\.com|linkt?r\.ee|fansly\.com|hoo\.be)/i;

// Simple check for follow/follower ratio combined with promo content
export function checkFollowRatio(
  followsCount: number,
  followersCount: number,
  description: string,
  debug: boolean = false
): { matches: boolean; reason?: string } {
  const followRatio = followsCount / followersCount;

  if (debug) {
    console.log(`Follow ratio: ${followRatio.toFixed(1)}x`);
  }

  const hasAdultContent = ADULT_CONTENT_PATTERN.test(description);
  const hasPromoLink = PROMO_LINK_PATTERN.test(description);

  if (hasAdultContent && hasPromoLink && followRatio > 5) {
    return {
      matches: true,
      reason: `Adult content with suspicious follow ratio (following ${followRatio.toFixed(
        1
      )}x more than followers)`
    };
  }

  return { matches: false };
}

// Some basic patterns to catch common spam
export const DEFAULT_PATTERNS: BlockPattern[] = [
  // Match "Free Onlyfans" or "Free OF" variations in display name
  {
    displayNamePattern: /free\s*(?:onlyfans|o\.?f\.?|only\.?fans)/i
  },
  // Match "Free Onlyfans" or "Free OF" variations in description
  {
    descriptionPattern: /free\s*(?:onlyfans|o\.?f\.?|only\.?fans|of\s*➡️)/i
  },
  // Match suspicious combinations specific to OF spam
  {
    descriptionPattern:
      /(?=.*(?:onlyfans\.com|getallmyl?inks\.com|linkt?r\.ee|fansly\.com))(?=.*(?:😘|💋|😈|🔥|🍰|🍬))(?=.*(?:click|check|tap|join|free|bio|link))/i
  },
  // Match common spam phrases with OF links
  {
    descriptionPattern:
      /(?:don'?t be shy|check it out|sweet tooth).*(?:onlyfans\.com|getallmyl?inks\.com|linkt?r\.ee|fansly\.com)/i
  },
  // Match very specific spam patterns
  {
    descriptionPattern:
      /(?:alone|sweet).*(?:join\s*me|tooth)\s*\?*.*(?:onlyfans\.com|fansly\.com|linkt?r\.ee|getallmyl?inks\.com)/i
  }
];
