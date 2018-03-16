function hasClass( elem, name ) {
  if (!elem || !elem.className) { return false }
  return ( ' ' + elem.className + ' ' ).indexOf( ' ' + name + ' ' ) >= 0
}

function addClass( elem, name ) {
  if (!elem) { return false }
  if ( !hasClass( elem, name ) ) {
    elem.className += ( elem.className ? ' ' : '' ) + name
  }
}

function toggleClass( elem, name, force ) {
  if (!elem || !elem.className) { return false }
  if ( force || typeof force === 'undefined' && !hasClass( elem, name ) ) {
    addClass( elem, name )
  } else {
    removeClass( elem, name )
  }
}

function removeClass( elem, name ) {
  if (!elem || !elem.className) { return false }
  let set = ' ' + elem.className + ' '

  // Class name may appear multiple times
  while ( set.indexOf( ' ' + name + ' ' ) >= 0 ) {
    set = set.replace( ' ' + name + ' ', ' ' )
  }

  // Trim for prettiness
  elem.className = typeof set.trim === 'function' ? set.trim() : set.replace( /^\s+|\s+$/g, '' )
}

export default {
  has: hasClass,
  add: addClass,
  toggle: toggleClass,
  remove: removeClass
}
