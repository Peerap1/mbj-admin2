// Compatibility entry point for react-scripts 5 on current Node.js versions.
// Overrides are scoped to this process; installed dependencies are never edited.
const fs = require("node:fs");
const path = require("node:path");

const command = process.argv[2];
if (!["start", "build"].includes(command)) {
  throw new Error("Expected start or build");
}

process.env.NODE_ENV = command === "start" ? "development" : "production";
process.env.BABEL_ENV = process.env.NODE_ENV;
require("react-scripts/config/env");

const requiredFilesModule = require.resolve("react-dev-utils/checkRequiredFiles");
require(requiredFilesModule);
require.cache[requiredFilesModule].exports = (files) => {
  for (const file of files) {
    try {
      fs.accessSync(file, fs.constants.F_OK);
    } catch {
      console.error("Could not find a required file.");
      console.error(`  Name: ${path.basename(file)}`);
      console.error(`  Searched in: ${path.dirname(file)}`);
      return false;
    }
  }
  return true;
};

if (command === "start") {
  const configModule = require.resolve("react-scripts/config/webpackDevServer.config");
  const createConfig = require(configModule);
  const paths = require("react-scripts/config/paths");
  const redirectServedPath = require("react-dev-utils/redirectServedPathMiddleware");
  const noopServiceWorker = require("react-dev-utils/noopServiceWorkerMiddleware");

  require.cache[configModule].exports = (...args) => {
    const config = createConfig(...args);
    const before = config.onBeforeSetupMiddleware;
    delete config.onBeforeSetupMiddleware;
    delete config.onAfterSetupMiddleware;

    config.setupMiddlewares = (middlewares, server) => {
      // Preserve CRA's source-map and optional src/setupProxy.js registration
      // before the built-in middleware stack.
      before(server);
      // These must run AFTER static files, proxy and history fallback.
      middlewares.push(
        { name: "cra-redirect", middleware: redirectServedPath(paths.publicUrlOrPath) },
        { name: "cra-service-worker", middleware: noopServiceWorker(paths.publicUrlOrPath) },
      );
      return middlewares;
    };
    return config;
  };
}

require(`react-scripts/scripts/${command}`);
