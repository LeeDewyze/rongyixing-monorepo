# Legacy `/www/` deployment

This directory stores the complete Legacy Angular/Ionic static package and its
deployment instructions. It is intentionally separate from the current H5/Web
release packages.

## Layout

```text
deploy/legacy/
├── install-legacy-www.sh
├── nginx/rongyixing-legacy-www.conf.snippet
└── www/
```

The Legacy package uses this base path:

```html
<base href="/www/">
```

Therefore it must be served at:

```text
https://h5.songguoren.site/www/
```

Do not put it directly in the current H5 root directory.

## Server deployment

After pulling the repository on the server:

```bash
cd /path/to/rongyixing-monorepo/deploy/legacy
chmod +x install-legacy-www.sh
./install-legacy-www.sh
```

The default target is:

```text
/opt/rongyixing-legacy/www
```

To use another target:

```bash
INSTALL_DIR=/data/rongyixing-legacy ./install-legacy-www.sh
```

The script removes stale files through `rsync --delete` and only synchronizes
static files. It does not modify or reload Nginx.

## Nginx

Add `nginx/rongyixing-legacy-www.conf.snippet` inside the existing HTTPS
`server` block for `h5.songguoren.site`. Do not create another standalone
server block with the same domain.

Then validate and reload:

```bash
nginx -t
systemctl reload nginx
```

The current H5 remains available at:

```text
https://h5.songguoren.site/
```

Legacy is available at:

```text
https://h5.songguoren.site/www/
```

The existing `install-dist.sh` and `install-static-dist.sh` scripts are for
the current `h5/dist` and `web/dist` packages and must not be used for this
Legacy package.
