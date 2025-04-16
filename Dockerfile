FROM node:16
LABEL org.opencontainers.image.authors="containers@hausgold.de"

# Install system packages
RUN apt-get update -yqqq && \
  apt-get install -y \
    build-essential locales sudo vim libicu-dev \
    ca-certificates gconf-service ghostscript \
    libappindicator1 libasound2 libasound2-dev libatk1.0-0 libc6 \
    libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
    libgconf-2-4 libgconf2-dev libgdk-pixbuf2.0-0 libglib2.0-0 \
    libgtk-3-0 libgtk-3-dev libnspr4 libnss3 libpango-1.0-0 \
    libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
    libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils poppler-utils \
    fonts-liberation fonts-ipafont-gothic fonts-wqy-zenhei \
    fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    libdrm-dev libgbm-dev libxshmfence1 && \
  echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen && /usr/sbin/locale-gen

# Set the root password and grant root access to shell
RUN echo 'root:root' | chpasswd
RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

WORKDIR /app
