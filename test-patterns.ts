// src/test-patterns.ts
import { BskyAgent } from "@atproto/api";
import {
  DEFAULT_PATTERNS,
  ADULT_CONTENT_PATTERN,
  PROMO_LINK_PATTERN,
  checkFollowRatio
} from "./patterns";
import type { BlockPattern } from "./types";

class PatternTester {
  private agent: BskyAgent;
  private patterns: BlockPattern[];

  constructor(patterns: BlockPattern[] = DEFAULT_PATTERNS) {
    this.agent = new BskyAgent({ service: "https://bsky.social" });
    this.patterns = patterns;
  }

  async login(identifier: string, password: string): Promise<void> {
    try {
      await this.agent.login({ identifier, password });
      console.log(`✅ Successfully logged in as ${identifier}`);
    } catch (error) {
      throw new Error(`Failed to login: ${(error as Error).message}`);
    }
  }

  async testPatterns(handle: string) {
    try {
      console.log(`\n🔍 Testing patterns against @${handle}...\n`);

      // Fetch profile
      const profile = await this.agent.getProfile({ actor: handle });

      console.log("Profile Information:");
      console.log("-------------------");
      console.log(`Display Name: ${profile.data.displayName || "(none)"}`);
      console.log(`Handle: ${profile.data.handle}`);
      console.log(`Followers: ${profile.data.followersCount || 0}`);
      console.log(`Following: ${profile.data.followsCount || 0}`);
      console.log(`Posts: ${profile.data.postsCount || 0}`);
      console.log(`Description: ${profile.data.description || "(none)"}`);
      console.log("\nPattern Tests:");
      console.log("-------------");

      // Test for adult content and promo links
      const description = profile.data.description || "";
      const hasAdultContent = ADULT_CONTENT_PATTERN.test(description);
      const hasPromoLink = PROMO_LINK_PATTERN.test(description);

      if (hasAdultContent) {
        console.log("⚠️  Found adult content indicators");
      }
      if (hasPromoLink) {
        console.log("⚠️  Found promotional link");
      }

      // Test follow ratio if both adult content and promo links are present
      if (profile.data.followersCount && profile.data.followsCount) {
        const result = checkFollowRatio(
          profile.data.followsCount,
          profile.data.followersCount,
          description
        );
        if (result.matches) {
          console.log(`⚠️  ${result.reason}`);
        } else {
          console.log(
            `✓ Follow ratio: ${(
              profile.data.followsCount / profile.data.followersCount
            ).toFixed(1)}x (following ${
              profile.data.followsCount
            } / followers ${profile.data.followersCount})`
          );
        }
      }

      // Test each pattern
      for (const pattern of this.patterns) {
        console.log("\nTesting pattern:");
        if (pattern.displayNamePattern) {
          const matches = pattern.displayNamePattern.test(
            profile.data.displayName || ""
          );
          console.log(
            `Display name vs ${pattern.displayNamePattern}: ${
              matches ? "⚠️  MATCH" : "✓ no match"
            }`
          );
        }
        if (pattern.descriptionPattern) {
          const matches = pattern.descriptionPattern.test(
            profile.data.description || ""
          );
          console.log(
            `Description vs ${pattern.descriptionPattern}: ${
              matches ? "⚠️  MATCH" : "✓ no match"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error testing patterns:", error);
    }
  }
}

async function main() {
  const handle = process.argv[2];
  if (!handle) {
    console.error(
      "Please provide a handle to test. Usage: bun run test-patterns.ts <handle>"
    );
    process.exit(1);
  }

  const tester = new PatternTester();

  const email = process.env.BLUESKY_EMAIL;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!email || !password) {
    console.error("BLUESKY_EMAIL and BLUESKY_APP_PASSWORD must be set");
    process.exit(1);
  }

  await tester.login(email, password);

  await tester.testPatterns(handle);
}

main().catch(console.error);
