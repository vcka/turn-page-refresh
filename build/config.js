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
    target = 'dist/' + (opts.name || 'turn.page') + '.' + opts.fmt + '.min.js'
  } else {
    target = 'dist/' + (opts.name || 'turn.page') + '.' + opts.fmt + '.js'
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

function getAllBuildsByPluginName(name = '', entry = 'src/index.js') {
  const obj = {}
  let key = 'web-'
  ;['dev', 'prod'].map(env => {
    const bakKey = key
    key += env + '-'
    ;['cjs', 'es', 'umd', 'iife'].map(fmt => {
      const bakKey = key
      key += fmt + (name ? ('-' + name) : '')
      // -> web-dev-cjs-list
      obj[key] = makeObj({ fmt, name, env, entry })
      key = bakKey
    })
    key = bakKey
  })

  return obj
}

function concatObj(plugins = []) {
  const obj = {}

  plugins.map(plugin => {
    const res = getAllBuildsByPluginName(plugin.name, plugin.entry)
    for (let prop in res) {
      obj[prop] = res[prop]
    }
  })

  return obj
}

const builds = concatObj([
  { name: '', entry: '' },
  { name: 'turn.list', entry: 'src/list.js' },
  { name: 'turn.grid', entry: 'src/grid.js' },
  { name: 'turn.vgrid', entry: 'src/vgrid.js' }
])

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
