const legend = () => {
  const instance = selection => {
    selection.each((data, selectionIndex, nodes) => {
      const g = d3
        .select(nodes[selectionIndex])
        .selectAll("g.legend-item")
        .data(data)
        .enter()
        .append("g")
        .classed("legend-item", true)
        .attr("transform", (_, i) => "translate(30, " + (i + 1) * 15 + ")");
      g.append("text")
        .text(d => d.name)
        .attr("transform", "translate(20, 0)")
        .classed("label", true);
      g.append("text")
        .text(d => d.value)
        .attr("transform", "translate(30, 0)")
        .classed("value", true);
    });
  };

  instance.xScale = () => instance;
  instance.yScale = () => instance;
  return instance;
};