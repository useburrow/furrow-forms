# Container image for directory checks (Glama) and stdio-only runners.
# Runs the @furrowforms/mcp bridge: stdio in, hosted streamable HTTP out.
#
#   docker build -t furrow-forms-mcp .
#   docker run -i -e FURROW_TOKEN=frw_... furrow-forms-mcp
#
# Without FURROW_TOKEN the server still initializes and lists its tools;
# tool calls return an unauthorized error until a token or OAuth is used.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY packages/mcp/package.json packages/mcp/package-lock.json ./
RUN npm ci --omit=dev

COPY packages/mcp/bin ./bin

ENTRYPOINT ["node", "bin/furrow-forms-mcp.js"]
