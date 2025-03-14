# Use Node.js as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY ./frontend/package*.json ./
RUN npm install

# Add .npmrc if you're using private packages
COPY ./frontend/.npmrc ./.npmrc

# Enable caching for Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV development

# Copy the rest of the app
COPY ./frontend .

# Expose the app port
EXPOSE 3000

# Start the Next.js server in development mode
CMD ["npm", "run", "dev"]