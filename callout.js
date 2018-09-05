const callout = () => selection => {
  const width = 40,
    height = 15,
    h2 = height / 2;

  const calloutJoin = fc.dataJoin("path", "callout");
  const labelJoin = fc.dataJoin("text", "callout");

  selection.each((data, selectionIndex, nodes) => {
    calloutJoin(d3.select(nodes[selectionIndex]), [data]).attr(
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

    labelJoin(d3.select(nodes[selectionIndex]), [data])
      .attr("transform", "translate(" + (width - 3) + ", 0)")
      .text(d => d3.format(".2f")(d));
  });
};
