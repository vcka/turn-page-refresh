import constants from './constants.js'

export default function debug(obj) {
  if (!constants.TESTING) {
    console.log(obj)
    return false
  }
  let debugDiv = document.getElementById('clist-debug')
  if (!debugDiv) {
    debugDiv = document.createElement('div')
    debugDiv.className = 'debug'
    debugDiv.id = 'clist-debug'

    document.body.appendChild(debugDiv)
  }

  let str = ''
  if (typeof(obj) === 'object') {
    str = JSON.stringify(obj)
  } else {
    str = '' + obj
  }

  debugDiv.innerHTML += '[' + str + ']'
  console.log(str)
}
