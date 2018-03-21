export function type(obj) {
  return (
    Object.prototype.toString
      .call(obj)
      .split(' ')[1]
      .replace(/]/, '')
      .toLowerCase()
  )
}

export function isNumber(n) {
  return type(n) === 'number' && !isNaN(n)
}
