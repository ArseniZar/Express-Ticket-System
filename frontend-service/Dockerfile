FROM node:20-alpine

WORKDIR /app

COPY frontend-service/package*.json ./

RUN npm install

COPY frontend-service/ ./

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host"]