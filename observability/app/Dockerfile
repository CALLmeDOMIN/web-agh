FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --omit=dev

COPY tracing.js server.js ./

EXPOSE 3000

# tracing.js ladowane przez -r, zeby OTel zdazyl zainstrumentowac Express/HTTP
CMD ["node", "-r", "./tracing.js", "server.js"]
