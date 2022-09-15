import React from "react";
import * as d3 from "d3";
import "./DensityPlot.css";

const DensityPlot = ({
  width,
  height,
  margin,
  data,
  dateList,
  date
}) => {
  const canvasRef = React.useRef(false);
  const simulation_ = React.useRef();
  const [ctx, setCtx] = React.useState();
  const ctx_ = React.useRef();

  let previousDate = React.useRef(-Infinity);
  const nodes = React.useRef([]);

  let alpha_decay = 0.0005;
  let velocity_decay = 0.3

  const ticked = () => {
    if (ctx_.current) {
      ctx_.current.clearRect(0, 0, width, height);
      nodes.current.forEach((v) => {
        ctx_.current.beginPath();
        ctx_.current.fillStyle = "orange";
        ctx_.current.arc(v.x, v.y, size(v.magnitude), 0, Math.PI * 2);
        ctx_.current.fill();
      });
    }
  };

  const innerWeight = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const x = d3.scaleBand().domain(["All"]).range([0, width]).padding(1);
  const y = d3.scaleSequentialSqrt().domain([0, 300]).range([100, height]);
  const size = d3.scaleLinear().domain([0, 5]).range([2, 6]);

  const simulation = d3.forceSimulation();

  simulation
    .force("x", d3.forceX((d) => x("All")).strength(0.01))
    .force(
      "y",
      d3
        .forceY()
        .strength(0.05)
        .y((d) => y(parseFloat(d.depth)))
    )
    .force(
      "collide",
      d3.forceCollide().radius(function (d) {
        return size(d.magnitude) + 1;
      })
    )
    .force("charge", d3.forceManyBody().strength(-0.1))
    .alphaDecay(alpha_decay)
    .velocityDecay(velocity_decay)
    .on("tick", ticked).on('end', () => { simulation.alpha(0.5).alphaDecay(alpha_decay).restart()})

  simulation.nodes(nodes.current);

  //   let tick =0

  React.useEffect(() => {
    // create canvas current
    // get canvas and set reference
    if (!ctx_.current) {
      ctx_.current = canvasRef.current.getContext("2d");
    }

    dateList.forEach((val, i) => {
      setTimeout(function () {
        nodes.current = [
          ...nodes.current,
          ...data.filter(
            (v) => v.date <= dateList[i] && v.date > previousDate.current
          ),
        ];

        simulation.nodes(nodes.current);
        simulation.restart()
        previousDate.current = dateList[i]
      }, i * 200);
      
    });
  }, []);

  return (
    <div >
      <canvas
        id={"density-plot"}
        ref={canvasRef}
        width={width}
        height={height}
      ></canvas>
    </div>
  );
};

export default React.memo(DensityPlot);

