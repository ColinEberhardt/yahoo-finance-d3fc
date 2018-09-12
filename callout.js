const callout = () => {
  let scale = d3.scaleIdentity();

  const instance = selection => {
    const width = 40,
      height = 15,
      h2 = height / 2;

    const calloutJoin = fc.dataJoin("g", "callout");

    selection.each((data, selectionIndex, nodes) => {
      const lastPoint = data[data.length - 1];
      const calloutData = [lastPoint.high, lastPoint.ma];

      const element = calloutJoin(d3.select(nodes[selectionIndex]), calloutData)
        .attr("transform", d => "translate(0, " + scale(d) + ")");

      element
        .enter()
        .append("path")
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
        );

      element
        .enter()
        .append("text")
        .attr(
          "transform",
          d => "translate(" + (width - 3) + ", 0)"
        )
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
