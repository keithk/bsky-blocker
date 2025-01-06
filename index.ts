import { BlueskyBlocker } from "./bluesky-client";
import { DEFAULT_PATTERNS } from "./patterns";

async function main() {
  const blocker = new BlueskyBlocker(DEFAULT_PATTERNS);

  await blocker.login({
    identifier: process.env.BLUESKY_EMAIL || "",
    password: process.env.BLUESKY_APP_PASSWORD || ""
  });

  // Do a comprehensive check first time
  await blocker.checkAllFollowers();

  // Then check periodically (every 15 minutes)
  setInterval(() => {
    blocker.checkNewFollowers(50); // Check last 50 followers
  }, 15 * 60 * 1000);
}

main().catch(console.error);
