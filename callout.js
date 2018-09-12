const callout = () => {
  let scale = d3.scaleIdentity();

  const instance = selection => {
    const width = 40,
      height = 15,
      h2 = height / 2;

    const calloutJoin = fc.dataJoin("path", "callout");
    const labelJoin = fc.dataJoin("text", "callout");

    selection.each((data, selectionIndex, nodes) => {
      const lastPoint = data[data.length - 1];
      const calloutData = [lastPoint.high, lastPoint.ma];

      calloutJoin(d3.select(nodes[selectionIndex]), calloutData)
        .attr(
          "d",
          d3.area()([
            [0, 0],
            [h2, -h2],
            [width, -h2],
            [width, h2],
            [h2, h2],
            [0, 0]
          ])
        )
        .attr("transform", d => "translate(0, " + scale(d) + ")");

      labelJoin(d3.select(nodes[selectionIndex]), calloutData)
        .attr("transform", d => "translate(" + (width - 3) + ", " + scale(d) + ")")
        .text(d => d3.format(".2f")(d));
    });
  };

  instance.scale = (...args) => {
    if (!args.length) {
      return scale;
    }
    scale = args[0];
    return instance;
  };

  return instance;
};
