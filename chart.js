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

const loadDataEndOfDay = d3.csv("/yahoo.csv", d => ({
  date: new Date(d.Timestamp * 1000),
  volume: Number(d.volume),
  high: Number(d.high),
  low: Number(d.low),
  open: Number(d.open),
  close: Number(d.close)
}));


const exchangeOpening = day => [
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 30, 0),
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 16, 0, 0)
];

const tradingHours = dates => {
  const getDateKey = date =>
    date.getMonth() + "-" + date.getDate() + "-" + date.getFullYear();

  const tradingHours = dates.reduce((acc, curr) => {
    const dateKey = getDateKey(curr);
    if (!acc.hasOwnProperty(dateKey)) {
      acc[dateKey] = [curr, curr];
    } else {
      acc[dateKey][1] = curr;
    }
    return acc;
  }, {});

  return Object.keys(tradingHours).map(d => tradingHours[d]);
};

const closest = (arr, fn) =>
  arr.reduce(
    (acc, value, index) =>
      fn(value) < acc.distance ? { distance: fn(value), index, value } : acc,
    {
      distance: Number.MAX_VALUE,
      index: 0,
      value: arr[0]
    }
  );

const flatten = arr => [].concat.apply([], arr);

const dateFormat = d3.timeFormat("%a %H:%M%p");
const priceFormat = d3.format(".2f");

const volumeSeries = fc
  .seriesSvgBar()
  .bandwidth(2)
  .crossValue(d => d.date)
  .decorate(sel =>
    sel
      .enter()
      .classed("volume", true)
      .attr("fill", d => (d.open > d.close ? "red" : "green"))
  );

const movingAverageSeries = fc
  .seriesSvgLine()
  .mainValue(d => d.ma)
  .crossValue(d => d.date)
  .decorate(sel => sel.enter().classed("ema", true));

const lineSeries = fc
  .seriesSvgLine()
  .mainValue(d => d.high)
  .crossValue(d => d.date);

const areaSeries = fc
  .seriesSvgArea()
  .mainValue(d => d.high)
  .crossValue(d => d.date);

const gridlines = fc
  .annotationSvgGridline()
  .yTicks(5)
  .xTicks(0);

const annotation = fc
  .annotationSvgLine()
  .label(d => priceFormat(d))
  .decorate(sel =>
    sel
      .enter()
      .select(".right-handle")
      .append("g")
      .attr("transform", "translate(-40, 0)")
      .call(callout())
  );

const verticalAnnotation = fc.annotationSvgLine().orient("vertical");

const bands = fc
  .annotationSvgBand()
  .orient("vertical")
  .fromValue(d => d[0][1])
  .toValue(d => d[1][0]);

const chartLegend = legend();

const crosshair = fc.annotationSvgCrosshair();


const multi = fc
  .seriesSvgMulti()
  .series([
    gridlines,
    areaSeries,
    volumeSeries,
    movingAverageSeries,
    lineSeries,
    annotation,
    // TODO: adding legend to the plot area via multi-series, probably
    // easier with the grid layout chart
    chartLegend,
    crosshair,
    verticalAnnotation,
    bands
  ])
  .mapping((data, index, series) => {
    const lastPoint = data[data.length - 1];
    const legendValue = data.crosshair.length
      ? data.crosshair[0].value
      : lastPoint;
    switch (series[index]) {
      case annotation:
        return [lastPoint.high, lastPoint.ma];
      case chartLegend:
        return ["open", "high", "low", "close", "date"].map(key => ({
          name: key,
          value:
            key !== "date"
              ? priceFormat(legendValue[key])
              : dateFormat(legendValue[key])
        }));
      case crosshair:
        return data.crosshair;
      case verticalAnnotation:
        return flatten(
          data.tradingHoursArray.map(d => [d[0], ...exchangeOpening(d[0])])
        );
      case bands:
        return d3.pairs(data.tradingHoursArray.map(d => exchangeOpening(d[0])));
      default:
        return data;
    }
  });

const ma = fc.indicatorMovingAverage().value(d => d.high);

// use the extent component to determine the x and y domain
const xExtent = fc.extentDate().accessors([d => d.date]);
const volumeExtent = fc
  .extentLinear()
  .pad([0, 2])
  .accessors([d => d.volume]);
const yExtent = fc
  .extentLinear()
  .pad([0.1, 0.1])
  .accessors([d => d.high, d => d.low]);

const xScale = fc.scaleDiscontinuous(d3.scaleTime());
const yScale = d3.scaleLinear();
const chart = fc
  .chartSvgCartesian(xScale, yScale)
  .yOrient("right")
  .plotArea(multi)
  .xTickFormat(dateFormat)
  .yTickFormat(priceFormat)
  .yTicks(5)
  // https://github.com/d3/d3-axis/issues/32
  .yTickSize(40)
  .yDecorate(sel => sel.select("text").attr("transform", "translate(10, -8)"))
  .xDecorate(sel =>
    sel
      .select("text")
      .attr("dy", undefined)
      .style("text-anchor", "start")
      .style("dominant-baseline", "central")
      .attr("transform", "translate(3, 10)")
  );

loadDataIntraday.then(data => {
  data = data
    .slice(0, 600)
    // filter out any data that is > 2 hours outside of trading
    .filter(d => d.date.getHours() > 7 && d.date.getHours() < 19);

  // compute the moving average data
  const maData = ma(data);

  // merge into a single series
  const mergedData = data.map((d, i) => ({ ma: maData[i], ...d }));
  mergedData.crosshair = [];

  const tradingHoursArray = tradingHours(data.map(d => d.date));

  const discontinuities = d3
    .pairs(tradingHoursArray)
    .map(d => [d[0][1], d[1][0]]);

  xScale.discontinuityProvider(fc.discontinuityRange(...discontinuities));

  mergedData.tradingHoursArray = tradingHoursArray;

  // set the domain based on the data
  const yDomain = yExtent(data);
  const volumeDomain = volumeExtent(data);

  chart.xDomain(xExtent(data)).yDomain(yDomain);

  const volumeToPriceScale = d3
    .scaleLinear()
    .domain(volumeDomain)
    .range(yDomain);
  volumeSeries.mainValue(d => volumeToPriceScale(d.volume));

  areaSeries.baseValue(d => yDomain[0]);

  const render = () => {
    // select and render
    d3.select("#chart-element")
      .datum(mergedData)
      .call(chart);

    const pointer = fc.pointer().on("point", event => {
      if (event.length) {
        const pointerDate = xScale.invert(event[0].x);
        const close = closest(mergedData, d =>
          Math.abs(pointerDate.getTime() - d.date.getTime())
        );
        mergedData.crosshair = [
          {
            x: xScale(close.value.date),
            y: yScale(close.value.high),
            value: close.value
          }
        ];
      } else {
        mergedData.crosshair = [];
      }
      render();
    });

    d3.select("#chart-element .plot-area").call(pointer);
  };
  render();
});
