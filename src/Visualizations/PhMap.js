import React from "react";
import * as d3 from "d3";
import "./PhMap.css";
const PhMap = ({ width, height, margin, geojson, data, date }) => {
  console.log("phmap running", date);
  const wrapperRef = React.useRef();

  // calculate margins and heights
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  let previousDate = React.useRef(-Infinity);

  const geoGenerator = React.useMemo(() => {
    console.log("are we running");

    let projection = d3
      .geoMercator()
      .fitSize([innerWidth, innerHeight], geojson);

    return d3.geoPath().projection(projection);
  }, [geojson, data]);

  const wrapperElement = d3.select(wrapperRef.current);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((v) => parseFloat(v.lat))))
    .range([margin.left, width - margin.left - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((v) => parseFloat(v.long))))
    .range([margin.top, height - margin.top - margin.bottom]);

  const rScale = d3.scaleLinear().domain([0, 5]).range([2, 30]);

  const yAxis = (g) =>
    g
      .call(
        d3
          .axisLeft(yScale)
          .tickFormat((d) => `${d} `)
          .ticks(10)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", 35)
          .attr("y", margin.top)
          .attr("font-weight", "bold")
          .attr("font-size", "0.87rem")
          .attr("stroke-width", 1)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text("Latitude")
      );

  wrapperElement
    .append("g")
    .attr("transform", `translate(${50}, ${margin.top})`)
    .call(yAxis);

  const dot = wrapperElement
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .attr("opacity", 1);

  React.useEffect(() => {
    console.log(date);
    dot
      .filter((d) => d.date > date.previousDate && d.date <= date.currentDate)
      .transition()
      .duration(1000)
      .attr("fill", "orange")
      .attr("stroke", "white")
      .attr("stroke-width", "3px")
      .attr("r", (d) => rScale(d.magnitude))
      .transition()
      .delay(300)
      .duration(500)
      // .attr("stroke", "#000")
      .attr("stroke-width", "0.2px")
      .attr("fill", "red")
      .attr("r", 5)
      .style("opacity", 0.2)

    // dot // exit
    //   .filter((d) => d.date <= date.currentDate)
    //   .transition()
    //   .duration(300)
    //   .attr("fill", "red")
    //   .attr("r", 4)
    //   .attr("stroke-width", "2px").remove()
  }, [date]);

  const clearPoints = () => {
    dot
      .filter((d) => d.date <= date.previousDate)
      .transition()
      .duration(1000)
      .attr("r", 0)
      .remove();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button
        onClick={() => {
          clearPoints();
        }}
      >
        Clear Points
      </button>
      <svg id={"phmap"} ref={wrapperRef} width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {geojson.features.map((v, i) => {
            return <path key={i} className="regions" d={geoGenerator(v)} />;
          })}
        </g>
      </svg>
    </div>
  );
};

export default React.memo(PhMap);
