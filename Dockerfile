# Menggunakan Nginx versi ringan
FROM nginx:alpine

# Menyalin file index.html milik kita ke folder server Nginx
COPY index.html /usr/share/nginx/html/index.html

# Mengarahkan port
EXPOSE 80

# Menjalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
