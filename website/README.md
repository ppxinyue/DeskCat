# DeskCat Product Website

Static product site for DeskCat.

## Local preview

From the repository root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/website/
```

## Download links

The page currently points to GitHub release artifacts:

- `DeskCat-1.1.3-arm64.dmg`
- `DeskCat-1.1.3-x64.dmg`
- `DeskCat-1.1.3-x64.exe`

For public deployment, upload the installer files to GitHub Releases, Vercel Blob, R2, S3, or another object storage service, then replace the `href` values in `index.html`.

Large installer files should not be committed to GitHub.

## Live user count and download tracking

Deploy `supabase/functions/deskcat-public-stats`, then set the `deskcat-public-stats-url` meta tag in `index.html` to the deployed Edge Function URL:

```html
<meta name="deskcat-public-stats-url" content="https://<project-ref>.functions.supabase.co/deskcat-public-stats" />
```

The site refreshes the total user count, total downloads, product website downloads, GitHub release downloads, total views, product website views, GitHub traffic views, and GitHub stars every 30 seconds. Page loads are recorded as product website views, and download button clicks are recorded as product website downloads.

GitHub traffic views come from GitHub's repository traffic API, which reports a rolling 14-day window and requires `GITHUB_TOKEN` in the Edge Function environment.
