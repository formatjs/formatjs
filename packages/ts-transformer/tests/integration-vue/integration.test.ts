import webpack from 'webpack'
import {VueLoaderPlugin} from 'vue-loader'
import {readFileSync} from 'fs'
import {join} from 'path'
import {transform} from '@formatjs/ts-transformer'
test('tranpilation', function (done) {
  webpack(
    {
      entry: require.resolve('./fixtures/main.ts'),
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
          {
            test: /\.[t|j]s$/u,
            use: [
              {
                loader: 'ts-loader',
                options: {
                  appendTsSuffixTo: [/\.vue$/u],
                  getCustomTransformers() {
                    return {
                      before: [
                        transform({
                          overrideIdFn: '[sha512:contenthash:base64:6]',
                        }),
                      ],
                    }
                  },
                  transpileOnly: true,
                },
              },
            ],
          },
        ],
      },
      plugins: [new VueLoaderPlugin()],
    },
    (err, stats) => {
      expect(err).toBeNull()
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
      const outFileContent = readFileSync(outFile, 'utf-8')
      expect(outFileContent).toContain(
        '.formatMessage({id:"XOeJ9m",defaultMessage:"message in created (id injected)"}))}'
      )
      expect(outFileContent).toContain(
        '$formatMessage({id:"GuoEHM",defaultMessage:"test message (id not injected)"}))'
      )
      expect(outFileContent).toContain(
        '.formatMessage({id:"S3wEt4",defaultMessage:"script setup"}))'
      )
      done()
    }
  )
}, 30000)
