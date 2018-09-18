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

const dateFormat = d3.timeFormat("%a %H:%M%p");
const priceFormat = d3.format(",.2f");

const legendData = datum => [
  { name: "Open", value: priceFormat(datum.open) },
  { name: "High", value: priceFormat(datum.high) },
  { name: "Low", value: priceFormat(datum.low) },
  { name: "Close", value: priceFormat(datum.close) },
  { name: "Volume", value: priceFormat(datum.volume) }
];

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
  .defined(d => isWithinOpeningHours(d.date))
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

const verticalAnnotation = fc
  .annotationSvgLine()
  .orient("vertical")
  .value(d => d.value)
  .decorate(sel => {
    sel
      .enter()
      .select(".bottom-handle")
      .append("use")
      .attr("transform", "translate(0, -20)")
      .attr("xlink:href", d => d.type);
    sel
      .enter()
      .select(".bottom-handle")
      .append("circle")
      .attr("r", 3);
  });

const bands = fc
  .annotationSvgBand()
  .orient("vertical")
  .fromValue(d => d[0][1])
  .toValue(d => d[1][0]);

const chartLegend = legend();

const crosshair = fc
  .annotationSvgCrosshair()
  .x(d => xScale(d.date))
  .y(d => yScale(d.high));

const markersForDay = day => {
  const openingHours = exchangeOpeningHours(day[0]);
  return [
    { type: "#pre", value: day[0] },
    { type: "#active", value: openingHours[0] },
    { type: "#post", value: openingHours[1] }
  ];
};

const multi = fc
  .seriesSvgMulti()
  .series([
    gridlines,
    areaSeries,
    volumeSeries,
    movingAverageSeries,
    lineSeries,
    chartLegend,
    bands,
    verticalAnnotation,
    crosshair
  ])
  .mapping((data, index, series) => {
    const lastPoint = data[data.length - 1];
    const legendValue = data.crosshair.length ? data.crosshair[0] : lastPoint;
    switch (series[index]) {
      case chartLegend:
        return legendData(legendValue);
      case crosshair:
        return data.crosshair;
      case verticalAnnotation:
        return flatten(data.tradingHoursArray.map(markersForDay));
      case bands:
        return d3.pairs(
          data.tradingHoursArray.map(d => exchangeOpeningHours(d[0]))
        );
      default:
        return data;
    }
  });

const ma = fc
  .indicatorMovingAverage()
  .value(d => d.high)
  .period(15);

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

const yCallout = callout().scale(yScale);

const xTickFilter = d3.timeMinute
  .every(30)
  .filter(d => d.getHours() === 9 && d.getMinutes() === 30);

const chart = fc
  .chartCartesian(xScale, yScale)
  .yOrient("right")
  .svgPlotArea(multi)
  .xTicks(xTickFilter)
  .xTickFormat(dateFormat)
  .xTickSize(20)
  .yTickFormat(priceFormat)
  .yTicks(5)
  // https://github.com/d3/d3-axis/issues/32
  .yTickSize(47)
  .yDecorate(sel => sel.select("text").attr("transform", "translate(20, -6)"))
  .xDecorate(sel =>
    sel
      .select("text")
      .attr("dy", undefined)
      .style("text-anchor", "start")
      .style("dominant-baseline", "central")
      .attr("transform", "translate(3, 10)")
  )
  .decorate(sel => {
    sel
      .enter()
      .append("d3fc-svg")
      .style("grid-column", 4)
      .style("grid-row", 3)
      .style("width", "3em")
      .on("draw.callout", (data, selectionIndex, nodes) => {
        d3.select(nodes[selectionIndex])
          .select("svg")
          .call(yCallout);
      });
    sel
      .enter()
      .append("div")
      .classed("border", true);
  });

loadDataIntraday.then(data => {
  data = data.slice(0, 500);

  // compute the moving average data
  const maData = ma(data);

  // merge into a single series
  const mergedData = data.map((d, i) => ({ ma: maData[i], ...d }));
  mergedData.crosshair = [];

  // compute the trading hours and use this to create our discontinuous scale
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

  // map the volume scale to the price - a cunning way to use the price
  // scale for our volume series!
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
      mergedData.crosshair = event.map(pointer =>
        closest(mergedData, d =>
          Math.abs(xScale.invert(pointer.x).getTime() - d.date.getTime())
        )
      );
      render();
    });

    d3.select("#chart-element .plot-area").call(pointer);
  };
  render();
});
