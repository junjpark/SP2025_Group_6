FROM node:25-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy application code
COPY . .

# Accept build arg for VITE_CLIENT_ID (for Google OAuth)
ARG VITE_CLIENT_ID
ENV VITE_CLIENT_ID=${VITE_CLIENT_ID}

# Expose port
EXPOSE 5173

# Default command (can be overridden)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

