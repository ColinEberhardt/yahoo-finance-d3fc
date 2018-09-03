const callout = () => selection => {
  const width = 40,
    height = 15,
    h2 = height / 2;

  selection.each((data, selectionIndex, nodes) => {
    d3.select(nodes[selectionIndex])
      .selectAll("path.callout")
      .data([data])
      .enter()
      .append("path")
      .classed("callout", true)
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
    d3.select(nodes[selectionIndex])
      .selectAll("text.callout")
      .data([data])
      .enter()
      .append("text")
      .classed("callout", true)
      .attr("transform", "translate(" + (width - 3) + ", 0)")
      .text(d => d3.format(".2f")(d));
  });
};
