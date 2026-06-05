// module.exports = {
//   reactStrictMode: false,
//   transpilePackages: [
//     "@coachgenie/api-client",
//     "@coachgenie/ui",
//     "@coachgenie/config"
//   ]
// }

module.exports = {
  reactStrictMode: false,
  transpilePackages: [
    "@coachgenie/api-client",
    "@coachgenie/ui",
    "@coachgenie/config"
  ],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
}