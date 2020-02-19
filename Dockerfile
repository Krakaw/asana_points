FROM node:10.9-alpine
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./package*.json ./
#COPY ./node_modules ./

#RUN npm install
# If you are building your code for production
RUN npm install --only=production

# Bundle app source
COPY . .
ENV PORT=4000
EXPOSE 4000
CMD [ "npm", "run", "start" ]
