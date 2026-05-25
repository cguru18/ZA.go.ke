FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Expose port (Cloud Run defaults to 8080 but handles process.env.PORT)
EXPOSE 5000

# Set Node environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
