FROM node:8
WORKDIR /src/app/
COPY ./package*.json ./
RUN npm install

COPY ./ ./

EXPOSE 8080

CMD ["node" , "server"]