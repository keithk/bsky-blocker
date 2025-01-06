# Bluesky Blocker

A tool to automatically detect and block spam accounts on Bluesky by analyzing follower patterns and content.

## Features

- Automatically detects spam accounts using configurable patterns
- Checks for suspicious follower/following ratios
- Adds detected accounts to a list
- Maintains a local database of checked followers
- Debug mode for detailed pattern matching information

## Installation

1. Install Bun (sorry for the extra tool, but i used it for the sqlite):

   - Visit https://bun.sh/ for installation instructions
   - Or run this command (macOS, Linux, WSL):
     ```bash
     curl -fsSL https://bun.sh/install | bash
     ```
   - Verify installation:
     ```bash
     bun --version
     ```

2. Clone the repository:

```bash
git clone https://github.com/keith/bsky-blocker.git
cd bsky-blocker
```

2. Install dependencies:

```bash
bun install
```

## Configuration

1. Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

2. Set up your Bluesky credentials in `.env`:

```env
BLUESKY_EMAIL=your.email@example.com
BLUESKY_APP_PASSWORD=your-app-password
```

Note: Use an App Password, not your main account password. You can create one in your Bluesky account settings.

3. Create a moderation list on Bluesky:

   - Go to https://bsky.app/moderation/modlists
   - Click "+ New"
   - Give it a name (e.g., "Spam Accounts")
   - After creating the list, copy the list ID from the URL
   - For example, if your list URL is `https://bsky.app/profile/username.bsky.social/lists/3jd92h5kw9s`, the ID is `3jd92h5kw9s`

4. Add your list ID to `.env`:

```env
BLOCKLIST_ID=3jd92h5kw9s
```

## Usage

### Check New Followers

To check your recent followers for spam accounts:

```bash
bun run index.ts
```

This will:

- Check your most recent followers
- Apply spam detection patterns
- Add matching accounts to your block list
- Save results to a local database

### Test Patterns Against a Specific Account

To test your spam detection patterns against a specific account:

```bash
bun run test-patterns.ts username.bsky.social
```

This will show:

- Account information
- Pattern matching results
- Follow ratio analysis
- Detailed debug information

### Debug Mode

To enable debug mode for detailed pattern matching information:

```typescript
const blocker = new BlueskyBlocker(DEFAULT_PATTERNS, true);
```

## Spam Detection

The tool does some basic checks to help spot potential spam accounts:

1. Simple text matching:

   - Looks for promotional content in display names
   - Checks for certain types of links in descriptions
   - Spots common promotional phrases

2. Basic behavior checks:
   - Looks at the ratio of following vs followers
   - Checks for combinations of promo links and certain emojis

You can customize these checks in `patterns.ts`. They're pretty basic but help catch some of the more obvious spam accounts.

## Database

The tool maintains a SQLite database (`db.sqlite`) to track which followers have been checked. This prevents re-checking the same accounts multiple times.

## Contributing

Feel free to submit issues and pull requests for:

- New spam detection patterns
- Bug fixes
- Feature improvements

## License

MIT
