# Use Node.js as the base image
FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Expo CLI globally
RUN npm install -g expo-cli

# Set the working directory
WORKDIR /app

# Copy package files
COPY ./mobile/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY ./mobile .

# Expose the Expo development server port
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV NODE_ENV=development

# Start the Expo development server
CMD ["npx", "expo", "start", "--host", "0.0.0.0"] 