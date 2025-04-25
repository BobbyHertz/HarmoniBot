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

# Apply custom overrides for package files
COPY package_overrides/@distube-youtube-index.js node_modules/@distube/youtube/dist/index.js
COPY package_overrides/@distube-ytdl-core-sig.js node_modules/@distube/ytdl-core/lib/sig.js

# Define the default command to run the app
CMD ["node", "index.js"]
