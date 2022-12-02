FROM mcr.microsoft.com/playwright:v1.28.1-focal as build
WORKDIR /app

#RUN rm -rf /ms-playwright/chromium-*
RUN rm -rf /ms-playwright/ffmpeg-*
RUN rm -rf /ms-playwright/webkit-*
RUN rm -rf /ms-playwright/firefox-*
RUN ls /ms-playwright
RUN rm -rf /var/lib/apt/lists/*

COPY package.json ./

RUN export DEBIAN_FRONTEND="noninteractive"
RUN apt update && apt install -y ca-certificates
RUN sed -i 's/devDependencies/ignore/g' package.json
RUN sed -i 's/optionalDependencies/ignore/g' package.json
RUN npm install --production
RUN npm install
RUN npm cache clean --force

COPY src ./src
COPY dist ./dist

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
# ENV DEBUG pw:api

CMD ["npm", "start"]
