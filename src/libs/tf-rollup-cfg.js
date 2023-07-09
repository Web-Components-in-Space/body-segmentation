import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import copy from 'rollup-plugin-copy';

export default [
    {
        input: './src/libs/tensorflow-bundle.js',
        output: {
            dir: './libs',
            format: 'es',
        },
        plugins: [nodePolyfills(), commonjs(), nodeResolve(), commonjs() ],
    },
    {
        input: './src/libs/body-segmentation-bundle.js',
        output: {
            dir: './libs',
            format: 'es',
        },
        plugins: [ commonjs(), nodeResolve() ]
    },

    {
        input: './src/libs/selfie_segmentation.js',
        plugins: [
            copy({
                targets: [
                    { src: 'src/libs/selfie_segmentation.js', dest: './libs' }
                ]
            })
        ]
    }
];
