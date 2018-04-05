import cls from './cclass'

export default class Grid {

  constructor(opts) {

    this.statics = opts.statics
    this.items = opts.statics.items
    this.datas = opts.datas
    this.rows = opts.rows
    this.columns = opts.columns
    this.oldRow = 0
    this.oldColumn = 0
    this.currRow = 0
    this.currColumn = 0

    // fns outer
    this._updateFocus = opts.updateFocus

    this.keys = {
      UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
      PAGE_UP: 33, PAGE_DOWN: 34, OK: 13, BACK: 8
    }

    this.vals = {
      up: -1, down: 1, left: -2, right: 2,
      pup: -3, pdown: 3, jump: 4
    }

    this.init()
  }

  init() {
    if (!this.datas || !this.datas.length) { return false }
    // let start = 0
    if (this.dataIdx > 0) {
      // const mod = this.dataIdx % this.rows
      // start = this.dataIdx - mod
      // this.currIdx = mod
    }
    // const datas = this.datas.slice(start, this.rows * this.columns)

    // if (!datas || !datas.length) {
    // throw new Error('[Turn/Grid] init failed, no datas')
    // }

    this.updateFocus()

    this.execCallbacks('moveUpDown')
    this.execCallbacks('inited')
  }

  clear() {}

  getPages() {}

  focus() {
    this.updateFocus()
  }

  touchEdge() {
    if (this.currRow === 0 && this.currColumn === 0) {
      // the left-up corner
      console.log('->>>>>>> left-up corder')
    } else if (this.currRow == 0 && this.currColumn === this.columns - 1) {
      // the right-up corner
      console.log('->>>>>>> right-up corder')
    } else if (this.currRow === this.rows - 1 && this.currColumn === 0) {
      // the left-down corner
      console.log('->>>>>>> left-down corder')
    } else if (this.currRow === this.rows - 1 && this.currColumn === this.columns - 1) {
      // the right-down corner
      console.log('->>>>>>> right-down corder')
    } else if (this.rows - 1 === this.currRow) {
      // the last row
      console.log('->>>>>>> down edge')
    } else if (this.currRow === 0) {
      // the first row
      console.log('->>>>>>> up edge')
    } else if (this.currColumn === this.columns - 1) {
      // the last column

      console.log('->>>>>>> right edge')
    } else if (this.currColumn === 0) {
      // the first column
      console.log('->>>>>>> left edge')
    } else if (this.dataIdx === this.datas.length - 1) {
      // the last one
      console.log('->>>>>>> last one')
    } else if (this.dataIdx === 0) {
      console.log('->>>>>>> first one')
    }
  }

  updateDataIdx() {
    this.dataIdx = (this.currRow + 1) * (this.currColumn + 1) - 1
  }

  updateFocus() {
    if (!this.datas || !this.datas.length) { return false }
    const currIdx = this.currRow * this.columns + this.currColumn
    const oldIdx = this.oldRow * this.columns + this.oldColumn
    const newEl = this.items[currIdx]
    const oldEl = this.items[oldIdx]

    if (currIdx !== oldIdx) {
      cls.remove(oldEl, 'focus')
    }

    if (!this.noInitFocus) {
      cls.add(newEl, 'focus')
    } else {
      this.noInitFocus = false
    }

    this._updateFocus && this._updateFocus({
      newIdx: currIdx, oldIdx: oldIdx, statics: this.statics,
      currRow: this.currRow, currColumn: this.currColumn,
      oldRow: this.oldRow, oldColumn: this.oldColumn
    })

    this.touchEdge()
    this.execCallbacks('updateFocusDone')
  }


  blur() {}

  pageUp() {}

  pageDown() {}

  left() {
    this.oldRow = this.currRow
    this.oldColumn = this.currColumn--
    this.dataIdx--
    this.idxChgHandler(this.vals.left)

  }

  right() {
    this.oldRow = this.currRow
    this.oldColumn = this.currColumn++
    this.dataIdx++
    this.idxChgHandler(this.vals.right)
  }

  up() {
    this.oldColumn = this.currColumn
    this.oldRow = this.currRow--
    this.dataIdx -= this.columns
    this.idxChgHandler(this.vals.up)
  }

  down() {
    this.oldColumn = this.currColumn
    this.oldRow = this.currRow++
    this.dataIdx += this.columns
    this.idxChgHandler(this.vals.down)
  }

  idxChgHandler() {
    this.updateDataIdx()
    this.updateFocus()
    console.log(
      this.currRow, this.currColumn, this.dataIdx, 'idxChgHandler'
    )
  }

  execCallbacks(fnName) {
    if (!this.datas || !this.datas.length) { return false }

    const callbacks = this.callbacks
    if (!callbacks) { return false }
    const fn = callbacks[fnName] || function() {}

    fn({
      data: this.datas[this.dataIdx],
      currRow: this.currRow,
      oldRow: this.oldRow,
      currColumn: this.currColumn,
      oldColumn: this.oldColumn,
      dataIdx: this.dataIdx
    })
  }

  keyHandler(keycode) {

    switch (keycode) {
    case this.keys.UP:
      this.up()
      break
    case this.keys.DOWN:
      this.down()
      break
    case this.keys.LEFT:
      this.left()
      break
    case this.keys.RIGHT:
      this.right()
      break
      // case 73: // for test, i
    case this.keys.PAGE_UP:
      this.pageUp()
      break
      // case 79: // for test, o
    case this.keys.PAGE_DOWN:
      this.pageDown()
      break
    case this.keys.BACK:
      this.back()
      break
    default: break
    }
  }
}
