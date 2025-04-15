# Use the official Node.js image as the base image
FROM node:20

# Install pnpm globally using Chinese mirror
RUN npm install -g pnpm --registry=https://registry.npmmirror.com

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies using Chinese mirror
RUN pnpm install --registry=https://registry.npmmirror.com

# Copy the rest of the application files
COPY . .

# Initialize Prisma
RUN pnpm prisma generate
RUN pnpm prisma db push

# Build the NestJS application
RUN pnpm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
