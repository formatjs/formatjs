React Intl Hello World Example
==============================

This is a very simple — yet runnable app — showing how to use React Intl to format message (string) that contains a placeholder, plural, and number.

## Running Example

**In the project directory, run:**
```
$ npm install
$ npm start
```
**Open [http://localhost:3000](http://localhost:3000) to view it in the browser.**

**Create translation file**
[How to add translation extraction with create-react-app](https://github.com/facebookincubator/create-react-app/issues/1227#issuecomment-266202754)  

```
npm install --save-dev babel-cli babel-preset-react-app babel-plugin-react-intl
```

create `.babelrc`
```
{
  "presets": ["react-app"],
  "plugins": [
    [
      "react-intl", {
        "messagesDir": "translations/messages",
        "enforceDescriptions": false
      }
    ]
  ]
}
```

add to `package.json`
```
"translate": "NODE_ENV=production babel ./src >/dev/null"
```

create translation
```
npm run translate
```
