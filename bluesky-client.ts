import { BskyAgent } from "@atproto/api";
import type { BlueskyCredentials, BlockPattern } from "./types";
import {
  DEFAULT_PATTERNS,
  ADULT_CONTENT_PATTERN,
  PROMO_LINK_PATTERN,
  checkFollowRatio
} from "./patterns";
import { DB } from "./db";

export class BlueskyBlocker {
  private agent: BskyAgent;
  private patterns: BlockPattern[];
  private db: DB;
  private debug!: boolean;

  constructor(
    patterns: BlockPattern[] = DEFAULT_PATTERNS,
    debug: boolean = false
  ) {
    this.agent = new BskyAgent({ service: "https://bsky.social" });
    this.patterns = patterns;
    this.db = new DB();
    this.debug = debug;
  }

  async login(credentials: BlueskyCredentials): Promise<void> {
    try {
      await this.agent.login({
        identifier: credentials.identifier,
        password: credentials.password
      });
      console.log(`✅ Successfully logged in as ${credentials.identifier}`);
    } catch (error) {
      throw new Error(`Failed to login: ${(error as Error).message}`);
    }
  }

  private async matchesPatterns(
    profile: any
  ): Promise<{ matches: boolean; reason?: string }> {
    // Fetch full profile data
    try {
      const profileView = await this.agent.api.app.bsky.actor.getProfile({
        actor: profile.did
      });
      const fullProfile = profileView.data;

      // Debug logging
      if (this.debug) {
        console.log(`\nDebug - Checking profile: ${fullProfile.handle}`);
        console.log(JSON.stringify(fullProfile, null, 2));
      }

      // Check for adult content indicators combined with follower ratio
      if (fullProfile.followersCount && fullProfile.followsCount) {
        const result = checkFollowRatio(
          fullProfile.followsCount,
          fullProfile.followersCount,
          fullProfile.description || "",
          this.debug
        );
        if (result.matches) {
          return result;
        }
      }

      // Then check standard patterns
      for (const pattern of this.patterns) {
        if (
          pattern.displayNamePattern &&
          pattern.displayNamePattern.test(fullProfile.displayName || "")
        ) {
          return {
            matches: true,
            reason: `Display name matches pattern: ${pattern.displayNamePattern}`
          };
        }
        if (
          pattern.descriptionPattern &&
          pattern.descriptionPattern.test(fullProfile.description || "")
        ) {
          return {
            matches: true,
            reason: `Description matches pattern: ${pattern.descriptionPattern}`
          };
        }
      }

      return { matches: false };
    } catch (error) {
      console.error(
        `Failed to fetch full profile data for ${profile.handle}:`,
        error
      );
      return { matches: false };
    }
  }

  async checkNewFollowers(limit: number = 50): Promise<void> {
    try {
      const followers = await this.agent.getFollowers({
        actor: this.agent.session?.did || "",
        limit
      });

      for (const follower of followers.data.followers) {
        if (!this.db.hasBeenChecked(follower.did)) {
          console.log(`\n👤 Checking follower: ${follower.handle}`);

          const matchResult = await this.matchesPatterns(follower);
          if (matchResult?.matches) {
            console.log(
              `🚫 Adding user ${follower.handle} (${follower.did}) to block list`
            );
            console.log(`   Reason: ${matchResult.reason}`);
            await this.addUserToBlockList(
              follower.did,
              follower.handle,
              matchResult.reason || "Unknown"
            );
          }

          await this.db.recordCheck({
            did: follower.did,
            handle: follower.handle,
            checkedAt: new Date(),
            blocked: matchResult?.matches || false,
            reason: matchResult?.reason
          });
        }
      }
    } catch (error) {
      console.error("❌ Error checking followers:", error);
    }
  }

  async addUserToBlockList(
    did: string,
    handle: string,
    reason: string = "Unknown"
  ): Promise<void> {
    try {
      const listId = process.env.BLOCKLIST_ID;

      if (!listId) {
        throw new Error(
          "BLOCKLIST_ID environment variable must be set (the UUID from your list's URL)"
        );
      }

      try {
        await this.agent.com.atproto.repo.createRecord({
          repo: this.agent.session?.did || "",
          collection: "app.bsky.graph.listitem",
          record: {
            $type: "app.bsky.graph.listitem",
            subject: did,
            list: `at://${this.agent.session?.did}/app.bsky.graph.list/${listId}`,
            createdAt: new Date().toISOString()
          }
        });
        console.log(`✅ Added ${handle} to shared block list`);
      } catch (listError) {
        // Check if user is already in the list
        if ((listError as Error).message?.includes("duplicate")) {
          console.log(`ℹ️  ${handle} is already in the block list`);
        } else {
          throw listError;
        }
      }
    } catch (error) {
      console.error(
        `❌ Failed to add user ${handle} to block list:`,
        (error as Error).message
      );
    }
  }

  async checkAllFollowers(): Promise<void> {
    console.log("🔍 Starting comprehensive follower check...");
    let totalChecked = 0;

    let cursor: string | undefined;
    do {
      const followers = await this.agent.getFollowers({
        actor: this.agent.session?.did || "",
        cursor,
        limit: 100
      });

      console.log(
        `\nProcessing batch of ${followers.data.followers.length} followers...`
      );

      for (const follower of followers.data.followers) {
        totalChecked++;
        if (!this.db.hasBeenChecked(follower.did)) {
          const matchResult = await this.matchesPatterns(follower);
          if (matchResult?.matches) {
            console.log(`👤 Checking follower: ${follower.handle}`);
            console.log(
              `🚫 Adding user ${follower.handle} (${follower.did}) to block list`
            );
            console.log(`   Reason: ${matchResult.reason}`);
            await this.addUserToBlockList(
              follower.did,
              follower.handle,
              matchResult.reason || "Unknown"
            );
          }

          await this.db.recordCheck({
            did: follower.did,
            handle: follower.handle,
            checkedAt: new Date(),
            blocked: matchResult?.matches || false,
            reason: matchResult?.reason
          });
        } else {
          console.log(`Skipped ${follower.handle} (already checked)`);
        }
      }

      cursor = followers.data.cursor;
    } while (cursor);

    console.log(
      `\n✅ Finished comprehensive follower check (processed ${totalChecked} followers)`
    );
  }
}
