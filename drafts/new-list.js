
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
