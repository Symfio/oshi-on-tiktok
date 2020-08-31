FROM node:10-alpine

ENV PATH /usr/src/app/node_modules/.bin:$PATH
ENV PORT=3000

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install

EXPOSE 3000
CMD [ "npm", "start"]