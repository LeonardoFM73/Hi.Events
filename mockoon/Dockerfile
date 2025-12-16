# Dockerfile untuk Mockoon CLI
# Digunakan untuk membuat custom image jika diperlukan

FROM mockoon/cli:latest

# Copy konfigurasi mock
COPY ./mockoon/xendit-mock.json /data/xendit-mock.json

# Expose port
EXPOSE 3000

# Run Mockoon CLI
CMD ["--data", "/data/xendit-mock.json", "--port", "3000"]
