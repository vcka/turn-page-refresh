const path = require('path')
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
// const cjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
// const node = require('rollup-plugin-node-resolve')
const version = process.env.VERSION || require('../package.json').version
const postcss = require('rollup-plugin-postcss')

// PostCSS plugins
const simplevars = require('postcss-simple-vars')
const nested = require('postcss-nested')
const cssnext = require('postcss-cssnext')
const cssnano = require('cssnano')

const aliases = require('./alias')
const constants = require('./constants')
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    return path.resolve(aliases[base], p.slice(base.length + 1))
  }
  return path.resolve(__dirname, '../', p)
}

const banner =
      '/*!\n' +
      ' * ' + constants.MODULE_NAME + ' v' + version + '\n' +
      ' * Email: gccll.love@gmail.com\n' +
      ' * (c) 2017-' + new Date().getFullYear() + ' Zhicheng Lee\n' +
      ' */'

const makeObj = (opts) => {
  let target = 'dist/'
  if (opts.env && opts.env === 'prod') {
    target = 'dist/' + constants.MODULE_NAME + '.' + (opts.name || opts.fmt) + '.min.js'
  } else {
    target = 'dist/' + constants.MODULE_NAME + '.' + (opts.name || opts.fmt) + '.js'
  }
  return {
    entry: resolve(opts.entry || 'src/index.js'),
    dest: resolve(target),
    format: opts.fmt,
    env: (opts.env === 'dev' || !opts.env) ? 'development' : 'production',
    banner: opts.banner || banner,
    moduleName: constants.MODULE_NAME
  }
}

const builds = {
  'web-dev-cjs': makeObj({ fmt: 'cjs' }),
  'web-dev-esm': makeObj({ fmt: 'es', name: 'esm' }),
  'web-dev-umd': makeObj({ fmt: 'umd' }),
  'web-dev-iife': makeObj({ fmt: 'iife' }),
  'web-prod-cjs': makeObj({ fmt: 'cjs', env: 'prod' }),
  'web-prod-esm': makeObj({ fmt: 'es', env: 'prod', name: 'esm' }),
  'web-prod-umd': makeObj({ fmt: 'umd', env: 'prod' }),
  'web-prod-iife': makeObj({ fmt: 'iife', env: 'prod' })
}

function genConfig(name) {
  const opts = builds[name]
  const config = {
    input: opts.entry,
    external: opts.externala,
    plugins: [
      postcss({
        plugins: [
          simplevars(),
          nested(),
          cssnext({ warnForDuplicates: false }),
          cssnano()
        ],
        extensions: ['.css']
      }),
      buble(),
      alias(Object.assign({}, aliases, opts.alias))
    ].concat(opts.plugins || []),
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: opts.moduleName || constants.MODULE_NAME
    }
  }

  if (opts.env) {
    config.plugins.push(replace({
      'process.nev.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  Object.defineProperty(config, '_name', {
    enumerable: false,
    value: name
  })

  return config
}

if (process.env.TARGET) {
  module.exports = genConfig(process.env.TARGET)
} else {
  exports.getBuild = genConfig
  exports.getAllBuilds = () => Object.keys(builds).map(genConfig)
}
