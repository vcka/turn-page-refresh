import cls from './cclass'

export default class Grid {

  constructor(opts) {

    this.callbacks = opts.callbacks
    this.statics = opts.statics
    this.items = opts.statics.items
    this.datas = opts.datas
    this.rows = opts.rows
    this.columns = opts.columns
    this.oldRow = 0
    this.oldColumn = 0
    this.currRow = 0
    this.currColumn = 0
    this.total = this.rows * this.columns
    this.dataIdx = 0
    this.currPage = 0
    this.totalPage = Math.ceil(this.datas.length / this.total)
    this.isLastRow = false
    this.fuzzy = 0 // 1 - left, 2 - right, 3 - both
    this.ban = opts.ban

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
      throw new Error('[Turn/List] the update template function required.')
    }

    this.clearTpl = opts.clearTpl
    if (!this.clearTpl) {
      throw new Error('[Turn/List] the clear template function required.')
    }

    this.init()
  }

  init(data) {
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

  clear() {}

  getPages() {}

  focus() {
    this.updateFocus()
  }

  touchEdge() {

    if (this.currRow === 0 && this.currColumn === 0) {
      // the left-up corner
      this.side = ''
      this.corner = this.vals.lucorner
    } else if (this.currRow == 0 && this.currColumn === this.columns - 1) {
      // the right-up corner
      this.side = ''
      this.corner = this.vals.rucorner
    } else if (this.currRow === this.rows - 1 && this.currColumn === 0) {
      // the left-down corner
      this.side = ''
      this.corner = this.vals.ldcorner
    } else if (this.currRow === this.rows - 1 && this.currColumn === this.columns - 1) {
      // the right-down corner
      this.side = ''
      this.corner = this.vals.rdcorner
    } else if (this.rows - 1 === this.currRow) {
      // the last row
      this.side = this.vals.down
      this.corner = ''
    } else if (this.currRow === 0) {
      // the first row
      this.side = this.vals.up
      this.corner = ''
    } else if (this.currColumn === this.columns - 1) {
      // the last column
      this.side = this.vals.right
      this.corner = ''
    } else if (this.currColumn === 0) {
      // the first column
      this.side = this.vals.left
      this.corner = ''
    } else {
      this.corner = this.side = ''
    }

    this.isLastRow = false
    if (
      // this.dataIdx === this.datas.length - 1
      this.dataIdx >= this.datas.length - this.columns
    ) {
      // the last row
      this.isLastRow = true
    }

    this.execCallbacks('touchEdge')
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
    this.updateFuzzyVal()
    this.execCallbacks('updateFocusDone')
  }

  blur() {}

  turn(direction) {
    const oldDataIdx = this.dataIdx
    let start = 0
    let data = null
    this.turnDirection = direction
    this.idxChgHandler()
    if (this.turnDirection === this.vals.left) {
      // to turn left page
      start = (this.currPage - 1) * this.total
      start = start <= 0 ? 0 : start
      this.dataIdx = start
      console.log(direction, start, this.dataIdx, 'turn')
      if (this.dataIdx < 0 || this.currPage <= 0) {
        this.dataIdx = oldDataIdx
        return false
      }

      this.currPage--

    } else if (this.turnDirection === this.vals.right) {
      // to turn right page
      start = (this.currPage + 1) * this.total

      this.dataIdx = start
      if (this.dataIdx > this.datas.length - 1) {
        this.dataIdx = oldDataIdx
        return false
      }

      this.currPage++

    } else if (this.turnDirection === this.vals.up) {
      // to turn up page
      return false
    } else if (this.turnDirection === this.vals.down) {
      // to turn down page
      return false
    }

    this.oldColumn = this.currColumn
    this.oldRow = this.currRow
    this.currColumn = 0
    this.currRow = 0
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
    this.oldRow = this.currRow
    this.oldColumn = this.currColumn--
    this.dataIdx--
    this.idxChgHandler(this.vals.left)
  }

  right() {
    if (
      this.side === this.vals.right ||
        this.corner === this.vals.rucorner ||
        this.corner === this.vals.rdcorner ||
        this.columns === 1
    ) {
      this.turn(this.vals.right)
      return false
    }
    this.oldRow = this.currRow
    this.oldColumn = this.currColumn++
    this.dataIdx++
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
    this.oldColumn = this.currColumn
    this.oldRow = this.currRow--
    this.dataIdx -= this.columns
    this.idxChgHandler(this.vals.up)
  }

  down() {
    if (this.isLastRow) {
      console.log('is the last row....')
      return false
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
    this.oldColumn = this.currColumn
    this.oldRow = this.currRow++
    this.dataIdx += this.columns
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
      dataIdx: this.dataIdx,
      side: this.side,
      corner: this.corner,
      turnDirection: this.turnDirection,
      oldIdx: this.oldRow * this.columns + this.oldColumn,
      newIdx: this.currRow * this.columns + this.currColumn,
      fuzzy: this.fuzzy,
      currPage: this.currPage,
      totalPage: this.totalPage
    })
  }

  keyHandler(keycode) {

    if (this.ban && this.ban.keys) {
      if (this.ban.keys.indexOf(keycode) > -1) {
        console.log('banned: ' + keycode)
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
}
