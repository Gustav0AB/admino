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
    plugins: ["react-native-reanimated/plugin"],
  };
};
