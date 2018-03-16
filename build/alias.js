const path = require('path')
const resolve = p => path.resolve(__dirname, '../', p)

module.exports = {
  entries: resolve('src/entries'),
  stb: resolve('src/stb'),
  web: resolve('src/web'),
  '@': resolve('src')
}
