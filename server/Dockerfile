FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY schema.sql ./
COPY src ./src
RUN mkdir -p data/uploads
EXPOSE 4000
CMD ["npm", "start"]
