const { withXcodeProject } = require('expo/config-plugins');

const TARGET_NAME = 'ExpoWidgetsTarget';

// expo-widgets hardcodes TARGETED_DEVICE_FAMILY = "1,2" (iPhone+iPad) when it
// creates the widget extension target (see addXCConfigurationList.js in
// expo-widgets' plugin source), regardless of the main app's ios.supportsTablet
// setting. This forces it back in sync with the main app's iPhone-only config.
//
// Must be listed BEFORE "expo-widgets" in app.json's plugins array — verified
// empirically that same-type (ios.xcodeproj) mods execute in reverse
// registration order, so listing this plugin earlier makes it run later,
// after expo-widgets' target-creation mod has already run.
const withExpoWidgetsDeviceFamily = (config) => {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const target = project.pbxTargetByName(TARGET_NAME);
    if (!target) return config;

    const configurationList = project.pbxXCConfigurationList()[target.buildConfigurationList];
    const allConfigurations = project.pbxXCBuildConfigurationSection();

    for (const { value } of configurationList.buildConfigurations) {
      const buildConfig = allConfigurations[value];
      if (buildConfig?.buildSettings) {
        buildConfig.buildSettings.TARGETED_DEVICE_FAMILY = '"1"';
      }
    }

    return config;
  });
};

module.exports = withExpoWidgetsDeviceFamily;
