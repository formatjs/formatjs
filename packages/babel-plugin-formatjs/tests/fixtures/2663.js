function App() {
  const intl = useIntl();

  // Uncomment either of the following 'error' functions and run `npm run build` to see errors.

  async function error1() {
    await intl.formatMessage({defaultMessage: 'foo', description: 'foo'});
  }
  async function ok1() {
    const message = intl.formatMessage({
      defaultMessage: 'foo',
      description: 'foo',
    });
    await message;
  }

  // async function error2() {
  //   return intl.formatMessage({ defaultMessage: 'foo', description: 'foo' });
  // }
  async function ok2() {
    const message = intl.formatMessage({
      defaultMessage: 'foo',
      description: 'foo',
    });
    return message;
  }

  // async function error3() {
  //   await console.log(
  //     intl.formatMessage({ defaultMessage: 'foo', description: 'foo' })
  //   );
  // }
  async function ok3() {
    const result = console.log(
      intl.formatMessage({defaultMessage: 'foo', description: 'foo'})
    );
    await result;
  }

  return null;
}
