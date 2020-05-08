intl.formatMessage(
  {
    defaultMessage: 'layer1 {name}',
  },
  {
    name: intl.formatMessage({
      defaultMessage: 'layer2',
    }),
  }
);
