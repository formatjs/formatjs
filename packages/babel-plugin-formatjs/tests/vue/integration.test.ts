import webpack from 'webpack'
import {VueLoaderPlugin} from 'vue-loader'
import {readFileSync} from 'fs'
import {resolve} from 'path'

test('dummy', function (done) {
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
                  'babel-plugin-formatjs',
                  {
                    idInterpolationPattern: '[sha512:contenthash:base64:6]',
                    ast: true,
                  },
                ],
              ],
            },
          },
        ],
      },
      plugins: [new VueLoaderPlugin()],
    },
    _ => {
      expect(readFileSync(resolve(__dirname, 'out.js'), 'utf-8')).toContain(
        '[{type:0,value:"Today is "},{type:3,value:"ts",style:{type:1,pattern:"yyyyMMdd",parsedOptions:{year:"numeric",month:"2-digit",day:"2-digit"}}}]'
      )
      done()
    }
  )
}, 20000)
