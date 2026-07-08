module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Must be last. Transforms Reanimated worklets so they run on the UI thread.
      'react-native-reanimated/plugin',
    ],
  };
};
