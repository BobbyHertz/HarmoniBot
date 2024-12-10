# Use tested Node.js base image
FROM node:22-bullseye

# Set the working directory in the container
WORKDIR /harmonibot

# Copy package.json into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Define the default command to run the app
CMD ["node", "index.js"]
