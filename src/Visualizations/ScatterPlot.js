import React from "react";
import * as d3 from "d3";
import "./ScatterPlot.css";

export const ScatterPlot = ({ width, height, margin, data, state }) => {
  const wrapperRef = React.useRef();

  const wrapperElement = d3.select(wrapperRef.current);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((v) => parseFloat(v.lat))))
    .range([margin.left, width - margin.left - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((v) => parseFloat(v.long))))
    .range([margin.top, height - margin.top - margin.bottom]);

  const yAxis = (g) =>
    g
      .call(
        d3
          .axisLeft(yScale)
          .tickFormat((d) => `${d} `)
          .ticks(10)
      )
      .call((g) => g.select(".domain").remove());

  const circles = wrapperElement.selectAll("circle").data(data).join("circle");

  wrapperElement.append("g").attr('transform', `translate(${margin.left + 30}, ${margin.top})`).call(yAxis);

  React.useEffect(() => {
    if (state) {
      circles
        .transition()
        .duration(1000)
        .attr("cx", (d) => xScale(d.lat))
        .attr("cy", (d) => yScale(d.long))
        .attr("fill", "red")
        .attr("r", 3);
    } else {
      circles
        .transition()
        .duration(1000)
        .attr("cx", (d) => xScale(d.lat))
        .attr("cy", (height - margin.top - margin.bottom) /2)
        .attr("fill", "blue")
        .attr("r", 6);
    }
  }, [data, state]);

  return (
    <svg
      transform={`translate(${margin.left}, ${margin.top})`}
      id={"scatterplot"}
      ref={wrapperRef}
      width={width}
      height={height}
    ></svg>
  );
};
