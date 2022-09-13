import React from "react";
import * as d3 from "d3";

export const useInterval = (callback, delay) => {
  const savedCallback = React.useRef();

  // Remember the latest function.
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

export const generateDateList = (startDate, stopDate) => {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate));
    let new_date = new Date(currentDate);
    new_date.setDate(new_date.getDate() + 1);
    currentDate = new_date;
  }
  return dateArray;
};

export const drawYaxis = (context, yScale, X, yExtent, innerWidth) => {
  const [startY, endY] = yExtent;

  context.font = "12px Lato";
  context.fillStyle = "#f7f7f7";
  context.fillText("↓ depth", X + 6, yExtent[0] + 20);

  const tickPadding = 3,
    tickSize = 6,
    yTicks = yScale.ticks(),
    yTickFormat = yScale.tickFormat();

  context.strokeStyle = "#f7f7f7";
  context.beginPath();
  context.globalAlpha = 0.1;
  yTicks.forEach((d) => {
    context.moveTo(X, yScale(d));
    context.lineTo(X + innerWidth, yScale(d));
  });
  context.stroke();
  context.globalAlpha = 1;

  //   context.beginPath();
  //   context.moveTo(X - tickSize, startY);
  //   context.lineTo(X, startY);
  //   context.lineTo(X, endY);
  //   context.lineTo(X - tickSize, endY);
  //   context.stroke();
  context.font = "10px Lato";
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillStyle = "#f7f7f7";
  yTicks.forEach((d) => {
    context.beginPath();
    context.fillText(yTickFormat(d), X - tickSize - tickPadding, yScale(d));
  });
};

export const drawCircles = (
  context,
  size_f,
  color_f,
  val,
  magRange,
  depthRange
) => {
  context.beginPath();

  if (
    val.magnitude > magRange[0] &&
    val.magnitude <= magRange[1] &&
    val.depth > depthRange[0] &&
    val.depth <= depthRange[1]
  ) {
    context.fillStyle = "white";
    context.arc(val.x, val.y, size_f(val.magnitude) + 1, 0, Math.PI * 2);
  } else {
    context.fillStyle = "#b4acb1";
    context.arc(val.x, val.y, size_f(val.magnitude) + 0.5, 0, Math.PI * 2);
  }

  context.fill();

  context.beginPath();
  if (
    val.magnitude > magRange[0] &&
    val.magnitude <= magRange[1] &&
    val.depth > depthRange[0] &&
    val.depth <= depthRange[1]
  ) {
    context.globalAlpha = 1;
    context.fillStyle = color_f(val.depth);
  } else {
    context.globalAlpha = 0.1;
    context.fillStyle = "gray";
  }


  context.arc(val.x, val.y, size_f(val.magnitude), 0, Math.PI * 2);
  context.fill();
};

export const calculateD3Parameters = ({ width, height, margin }) => {
  // force Simulation Settings
  const alpha_decay = 0;
  const velocity_decay = 0.5;

  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;
  const x_scaler = d3.scaleBand().domain(["All"]).range([0, innerWidth]);
  const y_scaler = d3
    .scaleSequentialSqrt()
    .domain([0, 300])
    .range([100, innerHeight]);
  const size = d3.scaleSqrt(2).domain([3, 6]).range([1, 20]);
  const colorScale = d3
    .scaleLinear()
    .domain(0, 300)
    .range(["#980043", "#f1eef6"])
    .interpolate(d3.interpolateRgb.gamma(2.2));

  const simulation = d3.forceSimulation();
  simulation
    .force("x", d3.forceX((d) => x_scaler("All")).strength(0.01))
    .force(
      "y",
      d3
        .forceY()
        .strength(0.05)
        .y((d) => y_scaler(parseFloat(d.depth)))
    )
    .force(
      "collide",
      d3.forceCollide(4).radius(function (d) {
        return size(d.magnitude) + 2;
      })
    )
    .force("charge", d3.forceManyBody().strength(-0.2))
    .alphaDecay(alpha_decay)
    .velocityDecay(velocity_decay);

  return {
    x_scaler,
    y_scaler,
    size,
    colorScale,
    simulation,
  };
};

export const legendCircle = (context) => {
  let scale,
    tickValues,
    tickFormat = (d) => d,
    tickSize = 5;

  function legend(context) {
    let g = context.select("g");
    if (!g._groups[0][0]) {
      g = context.append("g");
    }
    g.attr("transform", `translate(${[1, 1]})`);

    const ticks = tickValues || scale.ticks();

    const max = ticks[ticks.length - 1];

    g.selectAll("circle")
      .data(ticks.slice().reverse())
      .enter()
      .append("circle")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("cx", scale(max))
      .attr("cy", scale)
      .attr("r", scale);

    g.selectAll("line")
      .data(ticks)
      .enter()
      .append("line")
      .attr("stroke", "currentColor")
      .attr("stroke-dasharray", "4, 2")
      .attr("x1", scale(max))
      .attr("x2", tickSize + scale(max) * 2)
      .attr("y1", (d) => scale(d) * 2)
      .attr("y2", (d) => scale(d) * 2);

    g.selectAll("text")
      .data(ticks)
      .enter()
      .append("text")
      .attr("font-family", "'Helvetica Neue', sans-serif")
      .attr("font-size", 11)
      .attr("dx", 3)
      .attr("dy", 4)
      .attr("x", tickSize + scale(max) * 2)
      .attr("y", (d) => scale(d) * 2)
      .text(tickFormat);
  }

  legend.tickSize = function (_) {
    return arguments.length ? ((tickSize = +_), legend) : tickSize;
  };

  legend.scale = function (_) {
    return arguments.length ? ((scale = _), legend) : scale;
  };

  legend.tickFormat = function (_) {
    return arguments.length ? ((tickFormat = _), legend) : tickFormat;
  };

  legend.tickValues = function (_) {
    return arguments.length ? ((tickValues = _), legend) : tickValues;
  };

  return legend;
};
