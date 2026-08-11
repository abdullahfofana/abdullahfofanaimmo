const { getDefaultConfig } = require("expo/metro-config");

let withRorkMetro;
try {
    withRorkMetro = require("@rork-ai/toolkit-sdk/metro").withRorkMetro;
} catch (e) {
    // @rork-ai/toolkit-sdk not available (e.g. EAS cloud build)
    withRorkMetro = (config) => config;
}

const config = getDefaultConfig(__dirname);

module.exports = withRorkMetro(config);
