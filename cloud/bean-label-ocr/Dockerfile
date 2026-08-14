FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.mjs parser.mjs ./
ENV NODE_ENV=production
ENV PORT=8080
CMD ["npm", "start"]
