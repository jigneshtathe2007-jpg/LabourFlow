FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV WEB_ROOT=/app/backend/public

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend

COPY backend/server.js backend/db.js ./backend/
COPY *.html *.css ./backend/public/
COPY js ./backend/public/js/

EXPOSE 3000
CMD ["node", "backend/server.js"]
