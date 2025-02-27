# Use Node.js as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY ./frontend/package*.json ./
RUN npm install

# Copy the rest of the app
COPY ./frontend .

# Build the Next.js app
RUN npm run build

# Expose the app port
EXPOSE 3000

# Start the Next.js server
CMD ["npm", "run", "start"]