FROM node:8

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9100
CMD ["npm", "start"]