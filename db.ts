import { Database } from "bun:sqlite";
import type { FollowerCheck } from "./types";

export class DB {
  private db: Database;

  constructor() {
    this.db = new Database("db.sqlite");
    this.init();
  }

  private init() {
    this.db.run(`
            CREATE TABLE IF NOT EXISTS follower_checks (
                did TEXT PRIMARY KEY,
                handle TEXT NOT NULL,
                checked_at DATETIME NOT NULL,
                blocked BOOLEAN NOT NULL,
                reason TEXT
            )
        `);
  }

  async recordCheck(check: FollowerCheck): Promise<void> {
    const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO follower_checks (did, handle, checked_at, blocked, reason)
            VALUES (?, ?, ?, ?, ?)
        `);

    stmt.run(
      check.did,
      check.handle,
      check.checkedAt.toISOString(),
      check.blocked ? 1 : 0,
      check.reason || null
    );
  }

  getLastCheckedFollowers(limit: number = 50): string[] {
    const stmt = this.db.prepare(`
            SELECT did FROM follower_checks
            ORDER BY checked_at DESC
            LIMIT ?
        `);

    return stmt.all(limit).map((row) => (row as { did: string }).did);
  }

  hasBeenChecked(did: string): boolean {
    const stmt = this.db.prepare("SELECT 1 FROM follower_checks WHERE did = ?");
    return stmt.get(did) !== null;
  }
}
