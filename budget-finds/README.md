# Budget Finds: affiliate landing page

A static site (HTML, CSS, vanilla JS). No build step, no backend. Works on GitHub Pages.

Files: `index.html`, `styles.css`, `app.js` (public page), `admin.html`, `admin.css`, `admin.js` (admin panel), `products.json` (your catalogue).

## 1. Put it on GitHub Pages
1. Create a free account at github.com and click **New repository**. Name it e.g. `budget-finds`. Choose **Public**.
2. Click **uploading an existing file**, drag in all files from this folder (not the folder itself), and **Commit changes**.
3. Go to **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
4. After about a minute your site is at `https://YOURUSER.github.io/budget-finds/`. Admin is at `.../admin.html`.
5. Put your final URL in the Open Graph tags in `index.html` (`og:url`, `og:image`).

## 2. Create the fine-grained token (needed to publish)
1. GitHub > your profile photo > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
2. Name: `budget-finds-admin`. Expiration: 90 days or more (you will renew it).
3. **Repository access: Only select repositories**, choose your site repo.
4. **Permissions > Repository permissions > Contents: Read and write**. Leave everything else off.
5. Generate and copy the token (shown once). Paste it into the admin page only. Never put it in any file or share it.

## 3. Daily usage
1. Open `admin.html`. Add, edit or delete products. Drafts save automatically in your browser.
2. Click **Preview draft** to check how the site will look (`index.html?preview=1`).
3. Enter username, repo, branch and token (username and repo are auto-filled on github.io). Tick "Remember token" only on your own device.
4. Click **Publish to live site**. Wait about a minute, then refresh the site.
5. Use **Download products.json** now and then as a backup. **Import** restores one.

Notes: the draft lives in one browser only. Anyone can open `admin.html`, but only someone with the token can publish. If you edit from another device, import the backup first.

## 4. Replace before launch
- [ ] Email: already `realsuccessdiary@gmail.com` (footer in `index.html`). Confirm it.
- [ ] Social links: every `YOURHANDLE` / `YOURCHANNEL` in `index.html` (hero and footer).
- [ ] Disclosure wording: the Amazon line is only valid if you are in Amazon Associates. Add or adjust wording for Flipkart, Myntra, Meesho and any other programme, and check each programme's current rules.
- [ ] Sample testimonials: replace with real ones, or delete the section.
- [ ] All sample product links, prices and descriptions (use the admin panel). Use your own images or ones you have rights to.
- [ ] Privacy section: write a real policy, especially if you add analytics.
- [ ] Avatar: replace the "BF" circle in `index.html` with your photo; add `og-image.png` for link previews.
- [ ] Analytics: add your script and edit `track()` in `app.js` (clearly marked).
- [ ] Amazon Associates requires that you do not show stale prices. Keep the price note, or leave price empty.
