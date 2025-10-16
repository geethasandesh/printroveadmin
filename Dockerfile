# 1. Use Node.js official image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json first (only when they change)
COPY package*.json ./

# 4. Install only production dependencies
RUN npm install -legacy-peer-deps

# 5. Copy the rest of your app
COPY . .

# 6. Build the Next.js app
RUN npm run build

# 7. Expose the port Next.js runs on
EXPOSE 3000

# 8. Set default environment variable if not provided
ENV NEXT_PUBLIC_API_URL=https://printrove-api.vizdale.com/api

# 9. Start the app
CMD ["npm", "run", "start"]