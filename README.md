# turn-page-refresh
turn page refresh datas

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

`updateFocus`, *required*, to update the current and old row's focus class and content, for example: 

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

`updateTpl`, *required*, to update the content of list(only for the list item template), for example:

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

`clearTpl`, *required*, clear the list content

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

## listen key handler

proxy the key handler into the `list.keyHandler`


```
window.onkeydown = event => {
  list.keyHandler(event.keyCode || event.which)
}
```
