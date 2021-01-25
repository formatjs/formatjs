module.exports = [
  [
    "use-babel-config",
    {
      presets: ["react-app"],
      plugins: [
        "react-require",
        [
          "babel-plugin-formatjs",
          {
            idInterpolationPattern: "[sha512:contenthash:base64:6]",
            ast: true,
          },
        ],
      ],
    },
  ],
  [
    "use-eslint-config",
    {
      extends: ["react-app"],
      plugins: ["eslint-plugin-formatjs"],
      rules: {
        "formatjs/enforce-description": "error",
      },
    },
  ],
];
