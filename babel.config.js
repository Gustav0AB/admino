module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Transform import.meta → globalThis.__ExpoImportMetaRegistry
          // so Metro's web bundle doesn't produce a SyntaxError in the browser
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@shared": "./src/shared",
            "@features": "./src/features",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
