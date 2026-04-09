# Stage 1: Build the React Frontend
FROM node:18-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Node/Express Backend
FROM node:18-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server ./server
COPY --from=builder /app/dist ./dist

# Create volume mount directory for SQLite database
RUN mkdir -p /data
ENV DB_PATH=/data/heartmend.db

EXPOSE 3000
CMD ["node", "server/index.js"]
