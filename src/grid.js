import cls from './cclass'

export default class Grid {

  constructor(opts) {

    this.callbacks = opts.callbacks
    this.statics = opts.statics
    this.items = opts.statics.items
    this.datas = opts.datas
    this.rows = opts.rows
    this.multiCols = opts.multiCols || 0
    this.noInitFocus = opts.noInitFocus
    this.columns = opts.columns
    this.total = this.rows * this.columns
    this.dataIdx = 0
    this.oldDataIdx = 0
    this.currPage = 0
    this.totalPage = Math.ceil(this.datas.length / this.total)
    this.isLastRow = false
    this.isLastOne = false
    this.isLastCol = false
    this.fuzzy = 0 // 1 - left, 2 - right, 3 - both
    this.ban = opts.ban
    this.interrupt = opts.interrupt

    // fns outer
    this._updateFocus = opts.updateFocus

    this.keys = {
      UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
      PAGE_UP: 33, PAGE_DOWN: 34, OK: 13, BACK: 8
    }

    if (opts.province && opts.province === '海南') {
      this.keys = {
        UP: 87, DOWN: 83, LEFT: 65, RIGHT: 68,
        PAGE_UP: 306, PAGE_DOWN: 307, OK: 13, BACK: 8
      }
    }

    this.vals = {
      up: 'up', down: 'down', left: 'left', right: 'right',
      pup: 'page-up', pdown: 'page-down', jump: 'jump',
      lucorner: 'left-up-corner',
      ldcorner: 'left-down-corner',
      rucorner: 'right-up-corner',
      rdcorner: 'right-down-corner'
    }
    this.side = ''
    this.corner = this.vals.lucorner
    this.turnDirection = this.vals.left // left, right, up, down

    this.updateTpl = opts.updateTpl
    if (!this.updateTpl) {
      throw new Error('[Turn/Grid] the update template function required.')
    }

    this.clearTpl = opts.clearTpl
    if (!this.clearTpl) {
      throw new Error('[Turn/Grid] the clear template function required.')
    }

    this.init()
  }

  init(data) {
    if (!this.datas || !this.datas.length) { return false }

    let _data = data || this.datas.slice(0, this.total)
    if (data) {
      this.updateContent(_data)
    }
    this.updateFocus()
    this.execCallbacks('moveUpDown')
    this.execCallbacks('inited')
  }

  updateContent(data) {

    this.clearTpl(this.statics)

    for (let i = 0; i < this.total; i++) {
      if (this.updateTpl && this.items[i] && data[i]) {
        this.updateTpl(this.statics, i, data[i])
      }
    }
  }

  clear() {
    this.clearTpl(this.statics)
  }

  getPages() {}

  focus() {
    this.execCallbacks('beforeFocus')
    this.updateFocus()
  }

  getCurrent(isOld) {
    const dataIdx = isOld ? this.oldDataIdx : this.dataIdx
    const idx = dataIdx % (this.rows * this.columns)

    const ref = this.multiCols > 0 ? this.rows : this.columns

    const obj = {
      row: Math.floor(idx / ref),
      column: idx % ref
    }
    return obj
  }

  touchEdge() {

    const curr = this.getCurrent()
    let {
      row, column
    } = curr

    if (this.multiCols > 0) {
      row = curr.column
      column = curr.row
    }

    if (row === 0 && column === 0) {
      // the left-up corner
      this.side = ''
      this.corner = this.vals.lucorner
    } else if (row == 0 && column === this.columns - 1) {
      // the right-up corner
      this.side = ''
      this.corner = this.vals.rucorner
    } else if (row === this.rows - 1 && column === 0) {
      // the left-down corner
      this.side = ''
      this.corner = this.vals.ldcorner
    } else if (row === this.rows - 1 && column === this.columns - 1) {
      // the right-down corner
      this.side = ''
      this.corner = this.vals.rdcorner
    } else if (this.rows - 1 === row) {
      // the last row
      this.side = this.vals.down
      this.corner = ''
    } else if (row === 0) {
      // the first row
      this.side = this.vals.up
      this.corner = ''
    } else if (column === this.columns - 1) {
      // the last column
      this.side = this.vals.right
      this.corner = ''
    } else if (column === 0) {
      // the first column
      this.side = this.vals.left
      this.corner = ''
    } else {
      this.corner = this.side = ''
    }

    let mod = 0
    if (this.multiCols > 0) {
      this.isLastCol = false
      mod = this.datas.length % this.rows
      if (
        this.dataIdx >= this.datas.length - mod
      ) {
        // the last col
        this.isLastCol = true
      }
    } else {
      this.isLastRow = false
      mod = this.datas.length % this.columns
      if (
        this.dataIdx >= this.datas.length - mod
      ) {
        // the last row
        this.isLastRow = true
      }
    }

    this.isLastOne = false
    if (
      this.dataIdx === this.datas.length - 1
    ) {
      this.isLastOne = true
    }


    this.execCallbacks('touchEdge')
  }

  getIdxByDataIdx(dataIdx) {
    return (
      dataIdx % (this.rows * this.columns)
    )
  }

  updateFocus() {
    if (!this.datas || !this.datas.length) { return false }
    let currIdx, oldIdx
    const len = this.datas.length

    if (this.dataIdx > len - 1) {
      if (len % this.rows === 0) {
        this.dataIdx = this.oldDataIdx
      } else {
        this.dataIdx = len - 1
      }
    }

    currIdx = this.getIdxByDataIdx(this.dataIdx)
    oldIdx = this.getIdxByDataIdx(this.oldDataIdx)

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

    const curr = this.getCurrent()
    const old = this.getCurrent(true)

    this._updateFocus && this._updateFocus({
      newIdx: currIdx, oldIdx: oldIdx, statics: this.statics,
      currRow: curr.row, currColumn: curr.column,
      oldRow: old.row, oldColumn: old.column
    })

    this.touchEdge()
    this.updateFuzzyVal()
    this.execCallbacks('updateFocusDone')
  }

  blur() {
    const currIdx = this.getIdxByDataIdx(this.dataIdx)
    this.execCallbacks('beforeBlur')
    cls.remove(this.items[currIdx], 'focus')
  }

  turn(direction) {
    const oldDataIdx = this.oldDataIdx = this.dataIdx
    let start = 0
    let data = null
    this.turnDirection = direction
    this.idxChgHandler()
    if (this.turnDirection === this.vals.left) {
      // to turn left page
      start = (this.currPage - 1) * this.total
      start = start <= 0 ? 0 : start
      this.dataIdx = start
      if (this.dataIdx < 0 || this.currPage <= 0) {
        this.dataIdx = oldDataIdx
        this.execCallbacks('turnLeft')
        return false
      }

      this.currPage--

    } else if (this.turnDirection === this.vals.right) {
      // to turn right page
      start = (this.currPage + 1) * this.total

      this.dataIdx = start
      if (this.dataIdx > this.datas.length - 1) {
        // this.dataIdx = this.datas.length - 1
        this.dataIdx = oldDataIdx
        return false
      }

      this.currPage++

    } else if (this.turnDirection === this.vals.up) {
      this.execCallbacks('turnUp')
      // to turn up page
      return false
    } else if (this.turnDirection === this.vals.down) {
      this.execCallbacks('turnDown')
      // to turn down page
      return false
    }

    data = this.datas.slice(this.dataIdx, this.dataIdx + this.total)
    this.execCallbacks('turnPage')
    this.init(data)
  }

  left() {

    if (
      this.side === this.vals.left ||
        this.corner === this.vals.lucorner ||
        this.corner === this.vals.ldcorner ||
        this.columns === 1
    ) {
      // turn left
      this.turn(this.vals.left)
      return false
    }
    this.oldDataIdx = this.dataIdx
    if (this.multiCols > 0) {
      this.dataIdx -= this.rows
    } else {
      this.dataIdx--
    }
    this.isLastOne = false
    this.isLastCol = false
    this.idxChgHandler(this.vals.left)
  }

  right() {

    if (this.multiCols > 0) {
      if (this.isLastCol) { return false }
    } else {
      if (this.isLastOne) { return false }
    }

    if (
      this.side === this.vals.right ||
        this.corner === this.vals.rucorner ||
        this.corner === this.vals.rdcorner ||
        this.columns === 1
    ) {
      this.turn(this.vals.right)
      return false
    }

    this.oldDataIdx = this.dataIdx
    if (this.multiCols > 0) {
      this.dataIdx += this.rows
    } else {
      this.dataIdx++
    }

    if (this.dataIdx > this.datas.length - 1) {
      this.dataIdx = this.datas.length - 1
    }
    this.idxChgHandler(this.vals.right)
  }

  up() {

    if (
      this.side === this.vals.up ||
        this.corner === this.vals.lucorner ||
        this.corner === this.vals.rucorner ||
        this.rows === 1
    ) {
      this.turn(this.vals.up)
      return false
    }
    this.oldDataIdx = this.dataIdx
    if (this.multiCols > 0) {
      this.dataIdx--
    } else {
      this.dataIdx -= this.columns
    }
    this.isLastOne = false
    this.isLastCol = false
    this.idxChgHandler(this.vals.up)
  }

  down() {

    if (this.multiCols > 0) {
      if (this.isLastOne) { return false }
    } else {
      if (this.isLastRow) { return false }
    }

    if (
      this.side === this.vals.down ||
        this.corner === this.vals.ldcorner ||
        this.corner === this.vals.rdcorner ||
        this.rows === 1
    ) {
      this.turn(this.vals.down)
      return false
    }
    this.oldDataIdx = this.dataIdx
    if (this.multiCols > 0) {
      this.dataIdx++
    } else {
      this.dataIdx += this.columns
    }
    this.isLastOne = false
    this.isLastCol = false
    this.idxChgHandler(this.vals.down)
  }

  updateFuzzyVal() {
    if (this.totalPage <= 1) {
      this.fuzzy = 0
    } else {
      if (this.currPage > 0 && this.currPage < this.totalPage - 1) {
        this.fuzzy = 3
      } else if (this.currPage === 0) {
        this.fuzzy = 2
      } else if (this.currPage === this.totalPage - 1) {
        this.fuzzy = 1
      }
    }
  }

  idxChgHandler() {
    // this.updateDataIdx()
    this.updateFocus()
  }

  ok() {
    this.execCallbacks('ok')
  }

  execCallbacks(fnName) {
    if (!this.datas || !this.datas.length) { return false }

    const callbacks = this.callbacks
    if (!callbacks) { return false }
    const fn = callbacks[fnName] || function() {}

    fn(this.getCbsParams())
  }

  getCbsParams() {
    const curr = this.getCurrent()
    const old = this.getCurrent(true)
    const _this = this
    return {
      focus: () => _this.focus(),
      blur: () => _this.blur(),
      oldEl: this.items[this.getIdxByDataIdx(this.dataIdx)],
      currEl: this.items[this.getIdxByDataIdx(this.oldDataIdx)],
      data: this.datas[this.dataIdx],
      currRow: curr.row,
      oldRow: old.row,
      currColumn: curr.column,
      oldColumn: old.column,
      dataIdx: this.dataIdx,
      side: this.side,
      corner: this.corner,
      turnDirection: this.turnDirection,
      oldIdx: this.oldRow * this.columns + this.oldColumn,
      newIdx: this.currRow * this.columns + this.currColumn,
      fuzzy: this.fuzzy,
      currPage: this.currPage,
      totalPage: this.totalPage
    }
  }

  interruptHandler(keycode) {

    const data = this.datas[this.dataIdx]
    const currEl = this.items[this.getIdxByDataIdx(this.dataIdx)]

    const attr = this.interrupt.attr
    if (keycode === this.keys.LEFT) {
      if (data.hasHold) {
        data.hasHold = false
        this.interrupt.handler(false, currEl)
        this.focus()
        return true
      }
    } else if (keycode === this.keys.RIGHT) {
      if (data.hasHold) {
        if (this.isLastCol) { return true }
        data.hasHold = false
        this.interrupt.handler(false, currEl)
      } else if (data[attr]) {
        data.hasHold = true
        this.blur()
        this.interrupt.handler(true, currEl)
        return true
      }
    } else if (keycode === this.keys.UP || keycode === this.keys.DOWN) {
      if (data.hasHold) {
        data.hasHold = false
        this.interrupt.handler(false, currEl)
      }
    }

    return false
  }

  keyHandler(keycode) {

    if (this.interruptHandler(keycode)) {
      return false
    }

    if (this.ban && this.ban.keys) {
      if (this.ban.keys.indexOf(keycode) > -1) {
        return false
      }
    }
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
      this.execCallbacks('keyBack')
      // this.back()
      break
    case this.keys.OK:
      this.execCallbacks('keyConfirm')
      break
    default: break
    }
  }

  log(name) {
    console.log({
      current: this.getCurrent(),
      oldCurrent: this.getCurrent(true),
      dataIdx: this.dataIdx,
      len: this.datas.length,
      side: this.side,
      corner: this.corner,
      columns: this.columns,
      isLastCol: this.isLastCol,
      isLastOne: this.isLastOne,
      multiCols: this.multiCols
    }, name)
  }
}
