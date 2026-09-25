services:
  server:
    image: ${ecr_registry}/${server_repo}:latest
    environment:
      PORT: 4000
      JWT_SECRET: $${JWT_SECRET}
      DB_PATH: /data/data.sqlite
    volumes:
      - todo-data:/data
    restart: unless-stopped

  client:
    image: ${ecr_registry}/${client_repo}:latest
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  todo-data:
