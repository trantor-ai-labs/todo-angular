# The toolchain is supplied, not borrowed.
#
# package.json declares engines.node ">=22.0.0". This image satisfies that declaration; it is not
# "whatever Node the laptop has". Angular 21 is the reason the declaration matters — it is zoneless
# by default, and the difference between Node majors is the difference between a build that
# reproduces and one that reproduces on one machine.

FROM node:22 AS build
WORKDIR /src
# Copy manifests first so a dependency layer survives source edits.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
# Served at the path layout TodoMVC's own Cypress spec expects, so that spec runs unedited against
# this app. The spec resolves `angular` to `angular/dist/browser` under a `/examples/` root.
COPY --from=build /src/dist/browser /usr/share/nginx/html/examples/angular/dist/browser

# One origin for the app and the API. The bundle asks its own origin for /api and this decides
# what that means, so the same image serves a laptop, the conformance network and a deployment
# without a rebuild or an injected hostname.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
