FROM node:latest
RUN mkdir -p /usr/src/Blog
WORKDIR /usr/src/Blog
COPY package.json /usr/src/Blog
RUN npm install
COPY . /usr/src/Blog
EXPOSE 80
EXPOSE 443
CMD ["npm","start"]