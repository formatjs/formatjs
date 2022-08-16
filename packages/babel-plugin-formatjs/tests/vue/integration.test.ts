import webpack from 'webpack'
import {VueLoaderPlugin} from 'vue-loader'
import {readFileSync} from 'fs'
import {join} from 'path'
test('dummy', function (done) {
  webpack(
    {
      entry: require.resolve('./fixtures/app.js'),
      output: {
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
    function (err, stats) {
      const statsJson = stats?.toJson()
      if (!statsJson) {
        throw new Error('missing stats')
      }
      if (err) {
        throw err
      }
      if (stats?.hasErrors()) {
        console.error(statsJson.errors)
        throw new Error('err compiling')
      }
      const outFile = join(
        statsJson.outputPath || __dirname,
        statsJson.assets?.[0].name || 'out.js'
      )
      expect(readFileSync(outFile, 'utf-8')).toContain(
        '[{type:0,value:"Today is "},{type:3,value:"ts",style:{type:1,pattern:"yyyyMMdd",parsedOptions:{year:"numeric",month:"2-digit",day:"2-digit"}}}]'
      )
      done()
    }
  )
}, 30000)
