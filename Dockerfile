FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN apt update \
    && apt install git

RUN npm install

COPY . .

EXPOSE 3333

CMD ["npm", "run", "start"]
