# turn-page-refresh
turn page refresh datas, used on STB(Set Top Box), compatible for all inner-browser of STB.

You can provide a list includes more items, `turn-page-refresh` will control it with key handler.

# Build

`git clone https://github.com/gcclll/turn-page-refresh.git`

if you want test on watching

`npm run dev:iife`

or other command you can use according to your environment: 

1. commonjs: `npm run dev:cjs`

2. es6 import: `npm run dev:esm`

3. umd: `npm run dev: umd`

or for the `production` environment: 

1. build: `npm run build`


# Usage

import or script

`<script src="./dist/turn.iife.js"></script>`

## create `turn.List` instance

```js

const list = new List({
  statics: {
    nos: document.querySelectorAll('.tvod-list-item-no'),
    cnames: document.querySelectorAll('.tvod-list-item-name'),
    icons: document.querySelectorAll('.tvod-list-item-icon img'),
    items: [].slice.call(document.querySelectorAll('ul li'))
  },
  datas: clist,
  callbacks: {
    moveUpDown: function(opts) {
      console.log([].slice.call(arguments)[0], 'moveUpDown')
    }
  },

  updateFocus: function(opts) {
    // the callback for focus changed by up/down/left/right key
  },

  updateTpl: function(statics, index, data) {
    // update the template
    // template in the every item of the list
  },

  clearTpl: function(statics) {
    // clear the list content
  }
})
```

some callbacks or update/clear functions should provide to `List`

For example: 

`callbacks.moveUpDown` used to listen the focus changing, and to do something(Such as, request the datas of second column list)

## listen key handler

proxy the key handler into the `list.keyHandler`


```
window.onkeydown = event => {
  list.keyHandler(event.keyCode || event.which)
}
```

# Functions

## `updateFocus`, *required*, to update the current and old row's focus class and content, for example: 

```
updateFocus: function(opts) {
  if (!opts) { return false }
  const newIcon = opts.statics.icons[opts.newIdx]
  if (opts.newIdx !== opts.oldIdx) {
    const oldIcon = opts.statics.icons[opts.oldIdx]
    if (oldIcon) {
      oldIcon.src = './assets/images/icon_tvod_22x22.png'
      oldIcon.style.width = '22px'
      oldIcon.style.height = '22px'
    }
  }

  if (newIcon) {
    newIcon.src = './assets/images/icon_tvod_26x26.png'
    newIcon.style.width = '26px'
    newIcon.style.height = '26px'
  }
}
```

## `updateTpl`, *required*, to update the content of list(only for the list item template), for example:

```
updateTpl: function(statics, index, data) {
  if (!statics || !data) { return false }
  const no = statics.nos && statics.nos[index]
  const name = statics.cnames && statics.cnames[index]
  const icon = statics.icons && statics.icons[index]
  no && (no.innerHTML = fillZero(data.ChannelNumber))
  name && (name.innerHTML = data.ChannelName)
  icon && (icon.style.visibility = 'visible')
}
```

## `clearTpl`, *required*, clear the list content

```
clearTpl: function(statics) {
  if (!statics) {
    return false
  }

  for (let i = 0; i < statics.items.length; i++) {
    const no = statics.nos[i]
    const name = statics.cnames[i]
    const icon = statics.icons[i]
    no.innerHTML = ''
    name.innerHTML = ''
    icon.style.visibility = 'hidden'
  }
}
```


# callbacks

Execute callbacks by `execCallbacks(fnName)`

```
execCallbacks(fnName) {
  if (!this.datas || !this.datas.length) { return false }

  const callbacks = this.callbacks
  if (!callbacks) { return false }
  const fn = callbacks[fnName] || function() {}

  fn({
    data: this.datas[this.dataIdx],
    currIdx: this.currIdx,
    oldIdx: this.oldIdx,
    dataIdx: this.dataIdx,
    inputNums: this.inputNums
  })
}
```

All supported callbacks as below:

## `inited`

this `inited` callback will called after the `Turn.List` created and inited, the `constructor` function executed.

In `inited`, you can do something for the first enter page and other you need.

## `moveUpDown`

The movement of the list by key-up(38) and key-down(40).

The key-up/down(38/40) key event will trigger `moveUpDown` callback, you can do things like updating row styles, update row content, request the second list datas, and so on.

列表行焦点移动时触发的回调，在这个里面你可以实时的更新当前行的焦点及其样式，甚至可以去请求第二列的数据（如果有的话）

## `updateRowsDone`

This will be triggered by the list's content updated, the several scenes as follow:

该回调在列表数据刷新的时候出发，刷新列表出发环境有以下几种：

1. 上键到头翻页(key up to end)。
2. 下键到头翻页(key down to end)。
3. 上下页键翻页(key pageup, pagedown)。
4. 数字键切台(number keys to switch channel)。

## `updateFocusDone`

This will be triggered by the current row focused.

该回调会在列表当前行获得焦点并设置完样式之后触发。

## `inputingNumber`

The callback when inputing number between zero up to nine, and it will log these numbers into `this.inputNums = []` defined in `Turn.List`.

数字输入事件的回调，会实时记录已经输入的数字，在 2 s 之后会触发切台，超出列表范围不做任何操作。
