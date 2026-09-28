// EAS Build only uploads files tracked by git, and google-services.json /
// GoogleService-Info.plist are intentionally kept out of git. Locally (and
// for anyone who hasn't set these env vars) app.json's relative paths keep
// working as-is; on EAS Build, GOOGLE_SERVICES_JSON / GOOGLE_SERVICE_INFO_PLIST
// are file-type environment variables (see eas env:list) that resolve to a
// path to the uploaded file on the build server, so we swap them in here.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
  ios: {
    ...config.ios,
    googleServicesFile:
      process.env.GOOGLE_SERVICE_INFO_PLIST ?? config.ios.googleServicesFile,
  },
});
