# FunApps.net hub

Static landing site for **funapps.net**: a home page plus a short page for each
free-for-fun app (Sky Above, Quakers, Bigfoot) with a Launch button.

You do **not** need to move the apps off Railway. Keep each app running where it
already is, then point pretty domains at those same services.

## Recommended URLs

| URL | Points at |
| --- | --- |
| `https://funapps.net` | This hub site (new Railway service) |
| `https://www.funapps.net` | Same hub (optional redirect) |
| `https://skyabove.funapps.net` | SkyLight / Sky Above Railway service |
| `https://quakers.funapps.net` | Quakers Railway service |
| `https://bigfoot.funapps.net` | BigFoot Railway service |

Current Railway URLs (used by Launch buttons until custom domains are live):

- Sky Above: https://skylight-production-4337.up.railway.app
- Quakers: https://quakers-production.up.railway.app
- Bigfoot: https://bigfoot-production-6a2c.up.railway.app

## 1. Deploy this hub on Railway

1. In your Railway project (or a new one), **New Service → GitHub Repo**.
2. Use `asujeff48/SkyLight` and set **Root Directory** to `funapps-site`.
   - Or create a dedicated `asujeff48/funapps` repo and copy this folder to its root.
3. Railway will build the `Dockerfile` and serve on `$PORT`.
4. Open the generated `*.up.railway.app` URL and confirm the home page loads.

## 2. Attach `funapps.net` to the hub service

In Railway → hub service → **Settings → Networking → Custom Domain**:

1. Add `funapps.net` and `www.funapps.net`.
2. Railway shows the DNS records to create (usually a CNAME to
   `*.up.railway.app`, or an apex ALIAS/ANAME depending on your DNS host).

At your domain registrar for **funapps.net**:

1. Create the records Railway asks for (CNAME / ALIAS).
2. Wait for DNS to propagate (often minutes, sometimes up to an hour).
3. Railway provisions HTTPS automatically once DNS verifies.

## 3. Attach app subdomains (no re-upload needed)

For each existing app service in Railway → **Custom Domain**:

| Service | Custom domain |
| --- | --- |
| SkyLight / Sky Above | `skyabove.funapps.net` |
| Quakers | `quakers.funapps.net` |
| BigFoot | `bigfoot.funapps.net` |

At the registrar, add a **CNAME** for each subdomain to the target Railway
shows (often something like `xxx.up.railway.app`).

The apps keep deploying from their own GitHub `main` branches. FunApps.net is
only DNS + this hub — not a copy of the app code.

## 4. Update Launch buttons to pretty URLs

After the subdomains work, edit `assets/config.js`:

```js
window.FUNAPPS_LAUNCH = {
  skyabove: 'https://skyabove.funapps.net',
  quakers: 'https://quakers.funapps.net',
  bigfoot: 'https://bigfoot.funapps.net',
}
```

Commit, push, and let the hub redeploy.

## Local preview

Any static server from this folder works, for example:

```bash
cd funapps-site
python3 -m http.server 4173
```

Open http://localhost:4173

## Pages

- `/` — FunApps home
- `/skyabove/` — Sky Above landing (free / just for fun + Launch)
- `/quakers/` — Quakers landing
- `/bigfoot/` — Bigfoot landing
