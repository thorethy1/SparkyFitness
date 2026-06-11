// Shared identifiers used by both app.config.ts and Apple target configs
// (targets/*/expo-target.config.js). Keep as plain CommonJS — target configs
// can't load TypeScript/ESM.

const IOS_APP_GROUP_DEV = 'group.6827d1df5271d2c4.5';
const IOS_APP_GROUP_PROD = 'group.6827d1df5271d2c4.5';

// Bundle identifiers for thorethy variant
const THORETHY_BUNDLE_DEV = 'app.sweetpotato2633.coral4840';
const THORETHY_BUNDLE_PROD = 'app.sweetpotato2633.coral4840';
const THORETHY_WIDGET_BUNDLE_DEV = 'app.sweetpotato2633.coral4840.widget';
const THORETHY_WIDGET_BUNDLE_PROD = 'app.sweetpotato2633.coral4840.widget';

const isDevVariant = () => {
  const env = process.env.APP_VARIANT || 'dev';
  return env === 'dev' || env === 'development';
};

const getIosAppGroup = () => (isDevVariant() ? IOS_APP_GROUP_DEV : IOS_APP_GROUP_PROD);

const getThorethyBundle = () => (isDevVariant() ? THORETHY_BUNDLE_DEV : THORETHY_BUNDLE_PROD);

const getThorethyWidgetBundle = () => (isDevVariant() ? THORETHY_WIDGET_BUNDLE_DEV : THORETHY_WIDGET_BUNDLE_PROD);

module.exports = {
  IOS_APP_GROUP_DEV,
  IOS_APP_GROUP_PROD,
  THORETHY_BUNDLE_DEV,
  THORETHY_BUNDLE_PROD,
  THORETHY_WIDGET_BUNDLE_DEV,
  THORETHY_WIDGET_BUNDLE_PROD,
  isDevVariant,
  getIosAppGroup,
  getThorethyBundle,
  getThorethyWidgetBundle,
};
