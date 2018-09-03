const legend = () => {
  const instance = selection => {
    selection.each((data, selectionIndex, nodes) => {
      const label = d3
        .select(nodes[selectionIndex])
        .selectAll("text.legend-label")
        .data(data);
      label
        .enter()
        .append("text")
        .classed("legend-label", true)
        .attr("transform", (_, i) => "translate(50, " + (i + 1) * 15 + ")")
        .merge(label)
        .text(d => d.name);

      const value = d3
        .select(nodes[selectionIndex])
        .selectAll("text.legend-value")
        .data(data);
      value
        .enter()
        .append("text")
        .classed("legend-value", true)
        .attr("transform", (_, i) => "translate(60, " + (i + 1) * 15 + ")")
        .merge(value)
        .text(d => d.value);
    });
  };

  instance.xScale = () => instance;
  instance.yScale = () => instance;
  return instance;
};
