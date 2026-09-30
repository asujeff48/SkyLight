FROM caddy:2-alpine

WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
RUN caddy fmt /etc/caddy/Caddyfile --overwrite

COPY index.html ./
COPY skyabove ./skyabove
COPY quakers ./quakers
COPY bigfoot ./bigfoot
COPY assets ./assets

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
