import webpack from 'webpack'
import {VueLoaderPlugin} from 'vue-loader'
import {readFileSync} from 'fs'
import {resolve} from 'path'
import {transform} from '../..'
test('dummy', function (done) {
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
    err => {
      expect(err).toBeNull()
      const outFileContent = readFileSync(resolve(__dirname, 'out.js'), 'utf-8')
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
}, 10000)
