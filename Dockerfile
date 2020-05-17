FROM node:10-alpine

ENV PATH /usr/src/app/node_modules/.bin:$PATH

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install

CMD [ "npm", "start"]