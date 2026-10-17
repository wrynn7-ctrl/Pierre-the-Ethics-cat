# Pierre the Ethical Cat

Pierre is a pompous French philosopher cat who answers your ethical questions with semi-ridiculous advice. It is a **joke app, for entertainment only**. Pierre is not real, and nothing he says is actual ethical, legal, medical, financial, or life advice. If you need real help, please talk to a real person.

It works in any modern browser (Chrome, Safari, Firefox, Edge; desktop and phone). There is nothing to install and no build step.

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer.

```
node server.js
```

Then open <http://localhost:3000> in your browser. (To use another port: `PORT=8080 node server.js`.)

Out of the box Pierre answers with his built-in jokes. No account, no key, no internet needed.

## The behind-the-scenes switch

Pierre has two brains:

- **jokes** (default): a big pile of hand-written jokes that live in the browser.
- **ai**: Pierre asks Claude (by Anthropic) to make up the answers, in character.

Visitors never see this switch. You flip it one of two ways:

1. Edit `pierre.config.json` and change it to `{"mode": "ai"}`. The server re-reads this file every time, so **no restart is needed**.
2. Or set the environment variable `PIERRE_MODE=ai` (this wins over the file).

AI mode also needs an API key from Anthropic. Copy `.env.example` to `.env` and fill in `ANTHROPIC_API_KEY=...`, or set it as an environment variable on your host. Never put the key in any file inside `public/`, and never commit `.env` (it is already in `.gitignore`). If the mode is `ai` but there is no key, Pierre quietly stays in jokes mode. If the AI ever fails, the page falls back to jokes too.

Optional settings: `PIERRE_MODEL` (default `claude-haiku-5-5`) and `PORT`. The server allows 20 questions per minute per visitor, to keep costs sane.

## Putting it on the internet

- **Static hosting only (jokes mode)**: GitHub Pages, Netlify, Cloudflare Pages and friends can serve the `public/` folder as-is. There is no server there, so Pierre uses jokes mode automatically.
- **Any Node host (AI mode possible)**: Render, Railway, Fly.io, or any server that can run Node. Set the start command to `node server.js`, and add `ANTHROPIC_API_KEY` (and `PIERRE_MODE=ai`) in the host's environment settings.

### GitHub Pages (free, jokes mode)

1. On GitHub, open the repo's **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
2. Open the **Actions** tab, pick **Deploy to GitHub Pages**, and click **Run workflow** (it also runs on every push that changes `public/`).
3. After about a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Files

- `public/` is the website (page, styles, Pierre's face, voice, and the joke engine in `public/js/jokes.js`).
- `server.js` is the tiny server with no dependencies.
- `pierre.config.json` is the switch.

## The fine print

Pierre is a cat. This is a joke. Nothing here is real advice. If you or someone you know is in trouble, in the US call or text 988, or contact your local emergency services.
