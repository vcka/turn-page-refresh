var gridDatas = []
for (var i = 0; i < 47; i++) {
  var isTvod = 1
  // if (i == 10) isTvod = 0
  gridDatas.push({
    CityID: '10',
    CityName: i + 1,
    isTvod:  1// Math.floor(Math.random() * 2)
  })
}
