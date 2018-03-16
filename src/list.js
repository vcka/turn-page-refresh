import cls from './cclass'

export default class List {

  constructor(opts) {
    if (!opts) {
      throw new Error('[Turn/List] opts for `List` consturctor required.')
    }

    this.statics = opts.statics
    if (!this.statics) {
      throw new Error('[Turn/List] no static list elements cached, the `items required`.')
    }

    // the all element of the list
    this.items = (opts.statics && opts.statics.items) || []

    if (!this.items || !this.items.length) {
      throw new Error('[Turn/List] no list items.')
    }

    this.datas = opts.datas || []
    if (!this.datas || !this.datas.length) {
      throw new Error('[Turn/List] no usable datas.')
    }

    this.updateTpl = opts.updateTpl
    if (!this.updateTpl) {
      throw new Error('[Turn/List] the update template function required.')
    }

    this.clearTpl = opts.clearTpl
    if (!this.clearTpl) {
      throw new Error('[Turn/List] the clear template function required.')
    }

    this.statics = opts.statics
    this.callbacks = opts.callbacks
    this.direction = opts.direction || 'vertical'
    this.dataIdx = 0
    this.dataLen = this.items.length
    // the current row's index()
    this.currIdx = 0
    this.oldIdx = 0
    this.rows = opts.rows || 7
    this.totalPages = Math.ceil(this.datas.length / this.rows)
    this.currPage = 0
    this._updateFocus = opts.updateFocus

    this.keys = {
      UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
      PAGE_UP: 33, PAGE_DOWN: 34, OK: 13, BACK: 8
    }

    this.vals = {
      up: -1, down: 1
    }

    this.init()

    // focus the first
    cls.add(this.items[0], 'focus')
  }

  init() {
    const datas = this.datas.slice(this.dataIdx, this.dataIdx + this.rows)

    if (!datas || !datas.length) {
      throw new Error('[Turn/List] init failed, no datas')
    }

    this.updateRows(this.items, datas)
    this.updateFocus()
  }

  getPages(type, target) {
    this.currPage = Math.floor(this.dataIdx / this.rows) + 1

    if (type === 'string') {
      if (!target) { return `${this.currPage} / ${this.totalPages}` }
      return target.replace(/current|\bc\b/i, this.currPage)
        .replace(/total|\bt\b/i, this.totalPages)
    } else if (type === 'object') {
      return { current: this.currPage, total: this.totalPages }
    } else if (type === 'array') {
      return [ this.currPage, this.totalPages ]
    }

    return `${this.currPage} / ${this.totalPages}`
  }

  updateRows(items, datas) {
    items = items || this.items

    if (!items || !items.length) {
      throw new Error('[Turn/List] update rows failed, no items.')
    }

    if (!datas || !datas.length) {
      throw new Error('[Turn/List] update rows failed, no datas.')
    }

    this.clearTpl(this.statics)

    for (let i = 0; i < this.rows; i++) {
      if (this.updateTpl && this.items[i] && datas[i]) {
        this.updateTpl(this.statics, i, datas[i])
      }
    }
  }

  updateFocus() {
    const newEl = this.items[this.currIdx]
    const oldEl = this.items[this.oldIdx]
    cls.remove(oldEl, 'focus')
    cls.add(newEl, 'focus')

    this._updateFocus && this._updateFocus({
      newIdx: this.currIdx, oldIdx: this.oldIdx, statics: this.statics
    })
  }

  updateList(direction) {
    const upCondition = direction === this.vals.down && this.dataIdx % this.rows === 0
    const downCondition = (
      // direction is up && (not last page || last page)
      direction === this.vals.up && (
        ((this.dataIdx + 1) % this.rows === 0) ||
          this.dataIdx === this.datas.length - 1)
    )

    if (upCondition || downCondition) {
      let datas = this.datas.slice(this.dataIdx, this.dataIdx + this.rows)
      if (direction === this.vals.up) {
        // from first page first row turn up to the last page last one
        const rows = (
          this.dataIdx === this.datas.length - 1 ?
            this.datas.length % this.rows - 1: this.rows
        )
        const start = this.dataIdx - rows
        datas = this.datas.slice(start < 0 ? 0 : start, this.dataIdx + 1)
      }
      this.updateRows(this.items, datas)
    }
  }

  idxChgHandler(direction) {

    // update the list content
    this.updateList(direction)
    // update the current row focus
    this.updateFocus()
    // update pages
    this.getPages()

    // to exec callback of moving
    const moveUpDown = this.callbacks && this.callbacks.moveUpDown
    moveUpDown && moveUpDown({
      direction, data: this.datas[this.currIdx]
    })
  }

  up() {
    if (this.direction === 'horizontal') {
      return false
    }

    this.oldIdx = this.currIdx
    if (this.currIdx <= 0) {
      if (this.dataIdx <= 0) {
        this.currIdx = this.datas.length % this.rows - 1
      } else {
        this.currIdx = this.rows - 1
      }
    } else {
      this.currIdx--
    }

    if (this.dataIdx > 0) {
      this.dataIdx--
    } else {
      this.dataIdx = this.datas.length - 1
    }

    this.idxChgHandler(this.vals.up)
  }

  down() {
    if (this.direction === 'horizontal') {
      return false
    }

    this.oldIdx = this.currIdx
    if (
      (this.currIdx >= this.rows - 1) ||
        (this.dataIdx === this.datas.length - 1)
    ) {
      this.currIdx = 0
    } else {
      this.currIdx++
    }

    if (this.dataIdx < this.datas.length - 1) {
      this.dataIdx++
    } else {
      this.dataIdx = 0
    }

    this.idxChgHandler(this.vals.down)
  }

  left() {
    if (this.direction === 'vertical') {
      return false
    }
  }

  right() {
    if (this.direction === 'vertical') {
      return false
    }
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
    case this.keys.PAGE_UP:
      this.pageUp()
      break
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
