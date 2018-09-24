# React-Intl Redux Example
This is a simple and runnable example showing how to use React Intl with [Redux](https://github.com/reactjs/redux). And how to dispatch actions to change the locale language on the fly.

## TL;DR
> The main idea is to connect `<IntlProvider>` with Redux store and map the selected `locale` and `messages` from state to `<IntlProvider>` props. The rest is normal Redux work (state reducers and dispatching actions etc.)

## Running Example

**In the project directory, run:**
```
$ npm install
$ npm start
```
**Open [http://localhost:3000](http://localhost:3000) to view it in the browser.**