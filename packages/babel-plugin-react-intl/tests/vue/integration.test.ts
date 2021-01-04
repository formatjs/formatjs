import webpack from 'webpack';
import {VueLoaderPlugin} from 'vue-loader';
import {readFileSync} from 'fs';
import {resolve} from 'path';
test.skip('dummy', function (done) {
  webpack(
    {
      entry: require.resolve('./fixtures/app.js'),
      output: {
        path: __dirname,
        filename: 'out.js',
      },
      module: {
        rules: [
          {
            test: /\.vue$/,
            loader: 'vue-loader',
          },
          // this will apply to both plain `.js` files
          // AND `<script>` blocks in `.vue` files
          {
            test: /\.js$/,
            loader: 'babel-loader',
            options: {
              plugins: [
                [
                  'babel-plugin-react-intl',
                  {
                    idInterpolationPattern: '[sha512:contenthash:base64:6]',
                    extractFromFormatMessageCall: true,
                    ast: true,
                  },
                ],
              ],
            },
          },
          {
            resourceQuery: /blockType=template/,
            loader: require.resolve('../'),
          },
        ],
      },
      plugins: [new VueLoaderPlugin()],
    },
    (err, stats) => {
      console.log(err, stats);
      // [Stats Object](#stats-object)
      //   if (err || stats.hasErrors()) {
      //     done(err);
      //   } else {
      //     done();
      //   }
      expect(readFileSync(resolve(__dirname, 'out.js'), 'utf-8')).toBe('asd');
      done();
    }
  );
});
