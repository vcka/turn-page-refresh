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
      return false
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
    this.oldDataIdx = this.dataIdx = 0
    this.dataLen = this.datas.length
    if (typeof(opts.cachedDataIdx) === 'string') {
      opts.cachedDataIdx = parseInt(opts.cachedDataIdx, 10)
    }
    this.cachedDataIdx = (
      opts.cachedDataIdx > this.dataLen - 1 || opts.cachedDataIdx < 0
    ) ? 0 : (opts.cachedDataIdx || 0)
    this.dataIdx = this.cachedDataIdx || 0
    console.log(this.dataIdx, this.oldDataIdx, 'cachedDataIdx')
    // the current row's index()
    this.currIdx = 0
    this.oldIdx = 0
    this.rows = opts.rows || 7
    this.totalPages = Math.ceil(this.datas.length / this.rows)
    this.currPage = 0
    this._updateFocus = opts.updateFocus
    this._focus = opts.focus
    this._blur = opts.blur
    this.noInitFocus = opts.noInitFocus
    this.inputNums = []
    this.inputTimer = null
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
      up: -1, down: 1, pup: -2, pdown: 2, jump: 3
    }

    this.init()
  }

  reinit(opts) {
    if (!opts || !opts.datas || !opts.datas.length) { return false }
    this.datas = opts.datas
    this.chgDataIdx(this.currIdx = this.oldIdx = 0)
    this.noInitFocus = opts.noInitFocus
    this.init()
  }

  init() {
    if (!this.datas || !this.datas.length) { return false }
    let start = 0
    if (this.dataIdx > 0) {
      const mod = this.dataIdx % this.rows
      start = this.dataIdx - mod
      this.currIdx = mod
    }
    const datas = this.datas.slice(start, this.dataIdx + this.rows)

    if (!datas || !datas.length) {
      throw new Error('[Turn/List] init failed, no datas')
    }

    this.updateRows(this.items, datas)
    this.updateFocus()

    this.execCallbacks('moveUpDown')
    this.execCallbacks('inited')
  }

  clear() {
    this.clearTpl(this.statics)
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
      // throw new Error('[Turn/List] update rows failed, no items.')
      return false
    }

    if (!datas || !datas.length) {
      // throw new Error('[Turn/List] update rows failed, no datas.')
      return false
    }

    this.clearTpl(this.statics)

    for (let i = 0; i < this.rows; i++) {
      if (this.updateTpl && this.items[i] && datas[i]) {
        this.updateTpl(this.statics, i, datas[i])
      }
    }

    this.execCallbacks('updateRowsDone')
  }

  focus() {
    if (!this.datas || !this.datas.length) { return false }

    cls.add(this.items[this.currIdx], 'focus')

    if (this._focus && typeof(this._focus) === 'function') {
      this._focus(this.items[this.currIdx])
    }
  }

  blur() {
    if (!this.datas || !this.datas.length) { return false }
    cls.remove(this.items[this.currIdx], 'focus')

    if (this._blur && typeof(this._blur) === 'function') {
      this._blur(this.items[this.currIdx])
    }
  }

  updateFocus() {
    if (!this.datas || !this.datas.length) { return false }
    const newEl = this.items[this.currIdx]
    const oldEl = this.items[this.oldIdx]

    if (this.currIdx !== this.oldIdx) {
      cls.remove(oldEl, 'focus')
    }

    if (!this.noInitFocus) {
      cls.add(newEl, 'focus')
    } else {
      this.noInitFocus = false
    }

    this._updateFocus && this._updateFocus({
      newIdx: this.currIdx, oldIdx: this.oldIdx, statics: this.statics
    })

    this.execCallbacks('updateFocusDone')
  }

  updateList(direction) {
    if (!this.datas || !this.datas.length) { return false }
    const upCondition = (
      (direction === this.vals.down && this.dataIdx % this.rows === 0) ||
        (direction === this.vals.pdown)
    )
    const downCondition = (
      // direction is up && (not last page || last page)
      (direction === this.vals.up && (
        ((this.dataIdx + 1) % this.rows === 0) ||
          this.dataIdx === this.datas.length - 1)) ||
        (direction === this.vals.pup)
    )

    const mod = this.datas.length % this.rows
    const total = this.datas.length
    if (upCondition || downCondition || direction === this.vals.jump) {
      let datas = this.datas.slice(this.dataIdx, this.dataIdx + this.rows)
      if (direction === this.vals.up) {
        // from first page first row turn up to the last page last one
        let rows = (
          (this.dataIdx === total - 1) ? (mod || this.rows) : this.rows
        )

        // if (rows <= 0) { rows = this.rows }

        let start = this.dataIdx - rows + 1, end = this.dataIdx + 1
        start = start < 0 ? 0 : start

        datas = this.datas.slice(start, end)
      } else if (direction === this.vals.pup) {
        // from first page first row turn up to the last page last one
        let rows = (
          (this.dataIdx === total - mod) ? mod : this.rows
        )

        if (rows <= 0) { rows = this.rows }

        let start = this.dataIdx - this.dataIdx % this.rows
        let end = this.dataIdx + rows

        datas = this.datas.slice(start, end)
      } else if (direction === this.vals.pdown || direction === this.vals.jump) {
        const start = this.dataIdx - this.dataIdx % this.rows
        datas = this.datas.slice(start < 0 ? 0 : start, start + this.rows)
      }

      this.updateRows(this.items, datas)
    }
  }

  jump(num) {

    let numStr = this.inputNums.join('')
    if (numStr) {
      numStr = numStr.replace(/^0+/, '')
    }

    const findIdx = this.callbacks.findIdx || null
    let idx = -1

    if (findIdx) {
      idx = this.execCallbacks('findIdx')
    }

    // 跳转后清空频道数字
    this.inputNums = []

    if (num > this.datas.length || num <= 0) {
      return false
    }
    this.blur()
    this.chgDataIdx(idx !== -1 ? idx : num - 1)
    this.oldIdx = this.currIdx
    this.currIdx = this.dataIdx % this.rows

    this.idxChgHandler(this.vals.jump)
  }

  inputNum(num) {
    if (typeof(num) !== 'number' || (num < 0 || num > 9)) {
      return
    }

    // 缓存输入的数字
    this.inputNums.push(num)
    let nums = this.inputNums
    // 频道号数字
    let channelNum = parseInt(nums.join(''), 10)
    this.execCallbacks('inputingNumber')
    clearTimeout(this.inputTimer)
    this.inputTimer = setTimeout(() => {
      clearTimeout(this.jumpTimer)
      this.jump(channelNum)
    }, 2000)

    if (this.inputNums.length >= 3) {
      clearTimeout(this.inputTimer)
      clearTimeout(this.jumpTimer)
      this.jumpTimer = setTimeout(() => {
        this.jump(channelNum)
      }, 800)
      return
    }
  }

  execCallbacks(fnName) {
    if (!this.datas || !this.datas.length) { return false }

    const callbacks = this.callbacks
    if (!callbacks) { return false }
    const fn = callbacks[fnName] || function() {}

    return fn(this.getCurrDatas())
  }

  getCurrDatas() {
    return {
      datas: this.datas,
      data: this.datas[this.dataIdx],
      oldData: this.datas[this.oldDataIdx],
      currIdx: this.currIdx,
      oldIdx: this.oldIdx,
      dataIdx: this.dataIdx,
      oldDataIdx: this.oldDataIdx,
      inputNums: this.inputNums,
      currEl: this.statics.items[this.currIdx],
      oldEl: this.statics.items[this.oldIdx],
      items: this.statics.items,
      pages: this.getPages('object')
    }
  }

  idxChgHandler(direction) {

    // update the list content
    this.updateList(direction)
    // update the current row focus
    this.updateFocus()
    // update pages
    this.getPages()

    this.execCallbacks('moveUpDown')
  }

  chgDataIdx(newIdx) {
    this.oldDataIdx = this.dataIdx
    this.dataIdx = newIdx
  }

  pageUp() {
    if (!this.datas || !this.datas.length) { return false }

    const total = this.datas.length
    if (total <= this.rows) { return false }

    this.oldIdx = this.currIdx
    const mod = this.datas.length % this.rows

    this.chgDataIdx(this.dataIdx - this.rows)

    if (this.dataIdx < 0) {
      this.chgDataIdx(this.datas.length - (mod || this.rows))
      if (this.currIdx >= mod) {
        this.currIdx = 0
      } else {
        this.chgDataIdx(this.dataIdx + this.currIdx)
      }
    }

    this.idxChgHandler(this.vals.pup)
  }

  pageDown() {
    if (!this.datas || !this.datas.length) { return false }

    const total = this.datas.length
    if (total <= this.rows) { return false }

    this.oldIdx = this.currIdx
    const mod = total % this.rows

    // this.dataIdx += this.rows

    if (this.dataIdx >= total - mod) {
      this.chgDataIdx(this.currIdx = this.dataIdx % this.rows)
    } else {
      this.chgDataIdx(this.dataIdx + this.rows)
    }


    // 倒数第二页下翻页时，焦点变化
    if (this.dataIdx >= total) {
      if (mod === 0) {
        this.chgDataIdx(this.currIdx = 0)
      } else if (this.currIdx > mod - 1) {
        this.chgDataIdx(total - mod)
        this.currIdx = 0
      } else {
        this.chgDataIdx(total - mod + this.currIdx)
      }
    }

    this.idxChgHandler(this.vals.pdown)
  }

  up(fromKeyLeft = false) {
    if (!this.datas || !this.datas.length) { return false }

    if (this.direction === 'horizontal' && !fromKeyLeft) {
      return false
    }

    this.oldIdx = this.currIdx
    const mod = this.datas.length % this.rows
    if (this.currIdx <= 0) {
      if (this.dataIdx <= 0) {
        this.currIdx = (
          mod === 0 ? this.rows - 1 : mod - 1
        )
      } else {
        this.currIdx = this.rows - 1
      }
    } else {
      this.currIdx--
    }

    if (this.dataIdx > 0) {
      this.chgDataIdx(this.dataIdx - 1)
    } else {
      this.chgDataIdx(this.datas.length - 1)
    }

    this.idxChgHandler(this.vals.up)
  }

  down(fromKeyRight = false) {
    if (!this.datas || !this.datas.length) { return false }

    if (this.direction === 'horizontal' && !fromKeyRight) {
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
      this.chgDataIdx(this.dataIdx + 1)
    } else {
      this.chgDataIdx(0)
    }

    this.idxChgHandler(this.vals.down)
  }

  ok() {
    this.execCallbacks('ok')
  }

  left() {
    if (this.direction === 'vertical') return false
    this.up(true)
  }

  right() {
    if (this.direction === 'vertical') return false
    this.down(true)
  }

  keyHandler(keycode) {

    // 数字键
    if (keycode >= 48 && keycode <= 57) {
      this.inputNum(keycode - 48)
      return false
    }
    switch (keycode) {
    case this.keys.OK:
      this.ok()
      break
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
