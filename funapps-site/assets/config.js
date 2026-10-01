/**
 * Launch URLs for each app.
 *
 * Today these point at Railway. After you attach custom domains
 * (see README.md), switch them to:
 *   skyabove → https://skyabove.funapps.net
 *   quakers  → https://quakers.funapps.net
 *   bigfoot  → https://bigfoot.funapps.net
 */
window.FUNAPPS_LAUNCH = {
  skyabove: 'https://skylight-production-4337.up.railway.app',
  quakers: 'https://quakers-production.up.railway.app',
  bigfoot: 'https://bigfoot-production-6a2c.up.railway.app',
}

document.querySelectorAll('[data-launch]').forEach((el) => {
  const key = el.getAttribute('data-launch')
  const url = window.FUNAPPS_LAUNCH?.[key]
  if (url) el.setAttribute('href', url)
})
