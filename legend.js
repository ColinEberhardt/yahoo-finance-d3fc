const legend = () => {
  const labelJoin = fc.dataJoin("text", "legend-label");
  const valueJoin = fc.dataJoin("text", "legend-value");

  const instance = selection => {
    selection.each((data, selectionIndex, nodes) => {
      labelJoin(d3.select(nodes[selectionIndex]), data)
        .attr("transform", (_, i) => "translate(50, " + (i + 1) * 15 + ")")
        .text(d => d.name);

      valueJoin(d3.select(nodes[selectionIndex]), data)
        .attr("transform", (_, i) => "translate(60, " + (i + 1) * 15 + ")")
        .text(d => d.value);
    });
  };

  instance.xScale = () => instance;
  instance.yScale = () => instance;
  return instance;
};
