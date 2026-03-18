FROM node:22-alpine AS build

WORKDIR /frontend

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://127.0.0.1:18080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frontend/dist /usr/share/nginx/html

EXPOSE 80
