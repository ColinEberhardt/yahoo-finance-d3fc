const loadDataIntraday = d3.json("/yahoo.json").then(json => {
  const chartData = json.chart.result[0];
  const quoteData = chartData.indicators.quote[0];
  return chartData.timestamp.map((d, i) => ({
    date: new Date(d * 1000 - 5 * 1000 * 60 * 60),
    high: quoteData.high[i],
    low: quoteData.low[i],
    open: quoteData.open[i],
    close: quoteData.close[i],
    volume: quoteData.volume[i]
  }));
});

const loadDataEndOfDay = d3.csv("/yahoo.csv", d => {
  d.date = new Date(d.Timestamp * 1000);
  return d;
});

const lineSeries = fc
  .seriesSvgLine()
  .mainValue(d => d.high)
  .crossValue(d => d.date);

const areaSeries = fc
  .seriesSvgArea()
  .mainValue(d => d.high)
  .crossValue(d => d.date);

const gridlines = fc.annotationSvgGridline().yTicks(5)
    .xTicks(0);

const multi = fc.seriesSvgMulti()
  .series([gridlines, areaSeries, lineSeries]);

const xScale = d3.scaleTime();


// use the extent component to determine the x and y domain
const xExtent = fc.extentDate().accessors([d => d.date]);

const yExtent = fc.extentLinear().accessors([d => d.high, d => d.low]);

const chart = fc
  .chartSvgCartesian(xScale, d3.scaleLinear())
  .yOrient("left")
  .plotArea(multi);

loadDataEndOfDay.then(data => {
  // set the domain based on the data
  chart.xDomain(xExtent(data)).yDomain(yExtent(data));

  areaSeries.baseValue(d => yExtent(data)[0])

  // select and render
  d3.select("#chart-element")
    .datum(data)
    .call(chart);
});
