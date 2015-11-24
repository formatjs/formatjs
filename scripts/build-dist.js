import * as p from 'path';
import * as fs from 'fs';
import rollup from 'rollup';
import babel from 'rollup-plugin-babel';
import npm from 'rollup-plugin-npm';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import UglifyJS from 'uglify-js';

const copyright = (
`/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`
);

function createBundle() {
    return rollup.rollup({
        entry: p.resolve('src/react-intl.js'),
        plugins: [
            babel({
                presets: [
                    'es2015-rollup',
                    'react',
                ],
            }),
            npm({
                jsnext: true,
                skip: [
                    'react',
                ],
            }),
            commonjs({
                sourceMap: true,
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
        ],
    });
}

function writeBundle(bundle, {minify = false}) {
    const filename = `react-intl${minify ? '.min.js' : '.js'}`;
    const dest = p.resolve(`dist/${filename}`);

    let result = bundle.generate({
        format: 'umd',
        moduleName: 'ReactIntl',
        banner: copyright,
        sourceMap: true,
        sourceMapFile: dest,
        globals: {
            react: 'React',
        },
    });

    if (minify) {
        result = UglifyJS.minify(result.code, {
            fromString: true,
            inSourceMap: result.map,
            outSourceMap: `${filename}.map`,
            warnings: true,
        });

        result.map = JSON.parse(result.map);
    } else {
        result.code += `\n//# sourceMappingURL=${filename}.map`;
    }

    let {code, map} = result;

    // Tweak source paths.
    map.sources = map.sources.map((path) => p.relative('..', path));
    map.sourceRoot = 'react-intl:///';

    fs.writeFile(dest, code);
    fs.writeFile(`${dest}.map`, JSON.stringify(map));

    console.log(`Writing: ${p.relative('.', dest)}`);
    console.log(`Writing: ${p.relative('.', `${dest}.map`)}`);
}

// -----------------------------------------------------------------------------

createBundle()
    .then((bundle) => {
        writeBundle(bundle, {minify: process.env.NODE_ENV === 'production'});
    })
    .catch((err) => console.error(err));
