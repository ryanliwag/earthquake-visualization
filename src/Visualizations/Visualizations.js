import "./Visualizations.css";
import React from "react";
import * as d3 from "d3";
import data from "../2022_philvolcs_filtered.csv";
import phGeoJsonData from "../phl_regions2.geojson";
import {
  generateDateList,
  drawYaxis,
  drawCircles,
  legendCircle,
} from "./Helper";
import { sliderBottom } from "d3-simple-slider";

const Visualizations = () => {
  // State Variables
  const [dataState, setDataState] = React.useState({
    phlVolcData: false,
    geoJsonData: false,
    state: false,
    dateList: [],
  });
  const pause = React.useRef(true);
  const [viz_size, setViz_size] = React.useState([600, 800]);

  // Ref Variables
  const countInterval = React.useRef();
  const ctx_ = React.useRef();
  const nodes = React.useRef([]);
  const date = React.useRef({
    previousDate: -Infinity,
    currentDate: new Date(2022, 0, 1),
  });
  const sliderState = React.useRef(0);
  const VisualizationContainerRef = React.useRef();
  const densityPlotRef = React.useRef();
  const densityPlotContainerRef = React.useRef();

  const depthRange = React.useRef([0, 400]);
  const magRange = React.useRef([3, 7]);

  const wrapperRef = React.useRef();
  const wrapperElement = d3.select(wrapperRef.current);
  const dots = React.useRef();
  const geoGenerator = React.useRef();

  const parseDate = d3.utcParse("%Y-%m-%d");

  //   const p = select(div)
  //     .append('p')
  //     .attr('id', 'value')
  //     .text(defaultValue.map(format('.2%')).join('-'));

  // Settings
  const height = 1000;

  const width_map = 600;
  const width_plot = 600;

  const margin = { top: 50, left: 50, right: 50, bottom: 50 };
  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth_map = width_map - margin.left - margin.right;
  const innerWidth_plot = width_plot - margin.left - margin.right;
  const inner_map_offset = 50;

  // force Simulation Settings
  const alpha_decay = 0;
  const velocity_decay = 0.3;

  // D3 calculations
  const x = d3.scaleBand().domain(["All"]).range([0, width_map]).padding(1);
  const y = d3
    .scaleSequentialSqrt()
    .domain([0, 400])
    .range([margin.top, innerHeight]);
  const size = d3.scaleSqrt(3).domain([3.4, 7]).range([3, 25]);
  const color_scale = d3
    .scaleLinear()
    .domain([0, 300])
    .range(["#a50f15", "#fee5d9"])
    .interpolate(d3.interpolateRgb.gamma(2.2));
  const simulation = d3.forceSimulation();

  const circleMagLegend = legendCircle()
    .scale(size)
    .tickValues([3.5, 5, 7])
    .tickFormat((d, i, e) => (i === e.length - 1 ? d + " Magnitude" : d))
    .tickSize(2); // defaults to 5

  const date_desc = wrapperElement
    .append("text")
    .attr("class", "date-desc")
    .attr("transform", `translate(${20}, ${margin.top})`)
    .text("Date Range: ");

  const depthslider = sliderBottom()
    .min(0)
    .max(400)
    .width(150)
    .ticks(4)
    .default([0, 400])
    .on("onchange", (val) => {
      depthRange.current = val;
      rerender_dots();
    });

  const magslider = sliderBottom()
    .min(3)
    .max(7)
    .width(150)
    .ticks(4)
    .default([3, 7])
    .on("onchange", (val) => {
      magRange.current = val;
      rerender_dots();
    });

  // Color Legend
  const legend_width = 200;
  const x_legend = d3
    .scaleLinear()
    .domain([0, 400])
    .rangeRound([0, legend_width]);

  d3.select("#phmap")
    .append("g")
    .attr("color", "white")
    .attr(
      "transform",
      `translate(${width_map / 2 + margin.left + 80}, ${margin.top + 200})`
    )
    .call(circleMagLegend);

  const color_legend = d3
    .select("#phmap")
    .append("g")
    .style("font-size", "12px")
    .style("color", "white")
    .attr(
      "transform",
      `translate(${width_map / 2 + margin.left}, ${margin.top + 130})`
    );

  const color_legend_label = color_legend.append("text").text("Depth");

  const color_legend_scale = color_legend
    .append("g")
    .attr("transform", `translate(${0}, ${2})`);

  color_legend_scale
    .selectAll("rect")
    .data(d3.range(0, 400, 100))
    .enter()
    .append("rect")
    .attr("x", (d) => x_legend(d))
    .attr("height", 10)
    .attr("width", legend_width * (100 / 400))
    .attr("fill", (d) => color_scale(d));

  color_legend_scale
    .call(d3.axisBottom(x_legend).tickFormat((v) => `${v}`))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll("line").remove())
    .call((g) =>
      g.selectAll("text").attr("transform", `translate(${0}, ${8})`)
    );

  const magsliderCon = d3.select("#phmap").append("g");

  magsliderCon
    .attr("transform", `translate(${20}, ${margin.top + 50})`)
    .call(magslider);

  magsliderCon
    .append("text")
    .attr("transform", `translate(${0}, ${-20})`)
    .attr("fill", "white")
    .text("Earthquake Magnitude");

  const depthsliderCon = d3.select("#phmap").append("g");

  depthsliderCon
    .append("text")
    .attr("transform", `translate(${0}, ${-20})`)
    .attr("fill", "white")
    .text("Earth Quake Depth");

  depthsliderCon
    .attr("transform", `translate(${20}, ${margin.top + 130})`)
    .call(depthslider);

  // contents.append("text").text("Tremors in the Philippines");
  // contents
  //   .append("text")
  //   .text(
  //     "Philippines average around 13000 earthquakes in a single year. Philippines is a country very prone to earthquake disasters as it is siesmically located within the active Pacific `Ring of Fire`. Eastern Mindanao, including Surigao del Norte, is one of the seismically active areas in the country because of the Philippine Fault and Philippine Trench, which are the main earthquake generators that can affect the area"
  //   );

  const ticked = () => {
    if (ctx_.current) {
      ctx_.current.clearRect(0, 0, width_map, height);
      nodes.current.forEach((v) => {
        drawCircles(
          ctx_.current,
          size,
          color_scale,
          v,
          magRange.current,
          depthRange.current
        );
      });
      drawYaxis(
        ctx_.current,
        y,
        margin.left,
        [margin.top, innerHeight],
        innerWidth_plot
      );
    }
  };

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
      d3.forceCollide(4).radius(function (d) {
        return size(d.magnitude) + 1;
      })
    )
    .force("charge", d3.forceManyBody().strength(-0.2))
    .alphaDecay(alpha_decay)
    .velocityDecay(velocity_decay)
    .on("tick", ticked);

  // Pull all Data and memoize
  React.useMemo(() => {
    const getData = async () => {
      Promise.all([d3.csv(data), d3.json(phGeoJsonData)]).then((result) => {
        // Volcanic Data
        let projection = d3
          .geoMercator()
          .fitSize([innerWidth_map - 100, innerHeight - 100], result[1]);

        setDataState({
          phlVolcData: result[0]
            .map((d) => {
              let t = projection([parseFloat(d.long), parseFloat(d.lat)]);
              return {
                ...d,
                x_map: t[0],
                y_map: t[1],
                date: parseDate(d.date),
              };
            })
            .sort((a, b) => a.date - b.date),
          geoJsonData: result[1],
          state: true,
          dateList: generateDateList(
            new Date(2022, 0, 1),
            new Date(2022, 7, 30)
          ),
        });

        const ctx_temp = densityPlotRef.current;
        ctx_.current = ctx_temp.getContext("2d");
        d3.select("#density-plot").on("mousemove", (e) => {
          var xy = d3.pointer(e);
          // hover dialog
        });
        // setDate({ ...datedd, currentDate: new Date(2022, 0, 1) });
        date.current = { ...date.current, currentDate: new Date(2022, 0, 1) };
        geoGenerator.current = d3.geoPath().projection(projection);
        setViz_size([
          VisualizationContainerRef.current.clientWidth,
          VisualizationContainerRef.current.clientHeight,
        ]);
        // Unpause Interval Animation
        pause.current = false;
      });
    };

    getData();
  }, []);

  const checkConditions = (magnitude, depth) => {
    if (
      magnitude > magRange.current[0] &&
      magnitude <= magRange.current[1] &&
      depth > depthRange.current[0] &&
      depth <= depthRange.current[1]
    ) {
      return true;
    } else {
      return false;
    }
  };

  function join(t, a, s) {
    function format(m) {
      let f = new Intl.DateTimeFormat("en", m);
      return f.format(t);
    }
    return a.map(format).join(s);
  }
  React.useEffect(() => {
    dots.current = d3
      .select(".points")
      .selectAll("circle")
      .data(dataState.phlVolcData)
      .join("circle")
      .attr("opacity", 0.8)
      .attr("transform", (d) => `translate(${d.x_map}, ${d.y_map})`);

    if (dataState.phlVolcData) {
      countInterval.current = setInterval(function () {
        intervaltick();
      }, 300);
    }
  }, [dataState]);

  const rerender_dots = () => {
    dots.current
      .filter((d) => d.date <= date.current.currentDate)
      .transition()
      .duration(300)
      .attr("fill", (d) => {
        return checkConditions(d.magnitude, d.depth)
          ? color_scale(d.depth)
          : "gray";
      })
      .attr("stroke", (d) => {
        return checkConditions(d.magnitude, d.depth) ? "white" : "#b4acb1";
      })
      .attr("opacity", (d) => {
        return checkConditions(d.magnitude, d.depth) ? 0.8 : 0.1;
      })
      .attr("stroke-width", "2px")
      .attr("r", (d) => size(d.magnitude));
  };

  const intervaltick = () => {
    if (!pause.current && dataState.phlVolcData) {
      date.current = {
        previousDate: date.current.currentDate,
        currentDate: dataState.dateList[sliderState.current],
      };
      sliderState.current = sliderState.current + 1;

      nodes.current = [
        ...nodes.current,
        ...dataState.phlVolcData.filter(
          (v) =>
            v.date <= date.current.currentDate &&
            v.date > date.current.previousDate
        ),
      ];

      let a = [{ month: "short" }, { day: "numeric" }, { year: "numeric" }];

      date_desc
        .transition()
        .duration(200)
        .text(
          `${join(new Date(2022, 0, 1), a, "-")} to ${join(
            date.current.currentDate,
            a,
            "-"
          )}`
        );
      simulation.nodes(nodes.current);
    }
    if (sliderState.current >= dataState.dateList.length) {
      date.current = {
        ...date.current,
        currentDate: new Date(2022, 7, 31),
      };
      pause.current = true;
      simulation.alphaDecay(0.002);
      clearInterval(countInterval.current);
    }

    rerender_dots();  
  };

  return (
    <div className="Visualization">
      <div ref={VisualizationContainerRef} className="Visualization-Container">
        <div className="InfoPanel">
          <div>
            <h1>Right on The Ring of Fire</h1>
            <h3>
              Visualization of Earthquakes that have occured in the Philippines
              (2022). Only earthquakes with magnitude above 3.5 have been
              included.
            </h3>
          </div>
          <p className={"description"}>
            Earthquakes are not uncommon in the Philippines which is located
            close to the seismically active Pacific Ring of Fire. According to
            Phivolcs, the philippines experiences an average of 20 earthquakes
            a day and 100 to 150 are felt per year.
          </p>
          <div className={"sources"}>
            <p>Sources</p>
            <ul>
              <li>
                <a
                  href={
                    "https://www.researchgate.net/publication/308756374_Earthquake_activities_in_the_Philippines_Islands_and_the_adjacent_areas"
                  }
                >
                  Earthquake activities in the Philippines Islands and the
                  adjacent areas
                </a>
              </li>
              <li>
                <a
                  href={
                    "https://www.phivolcs.dost.gov.ph/index.php/earthquake/earthquake-information3"
                  }
                >
                  Phivolcs Dataset
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border"></div>
        <svg id={"phmap"} ref={wrapperRef} width={width_map} height={height}>
          <g
            className={"points"}
            transform={`translate(${inner_map_offset + margin.left}, ${
              margin.top + 50
            })`}
          ></g>
          <g
            transform={`translate(${inner_map_offset + margin.left}, ${
              margin.top + 50
            })`}
          >
            {dataState.geoJsonData &&
              dataState.geoJsonData.features.map((v, i) => {
                return (
                  <path
                    key={i}
                    fill="white"
                    className="regions"
                    d={geoGenerator.current(v)}
                  />
                );
              })}
          </g>
        </svg>
        <div className="border"></div>
        <canvas
          id={"density-plot"}
          ref={densityPlotRef}
          width={width_plot}
          height={height}
        ></canvas>
      </div>
    </div>
  );
};

export default React.memo(Visualizations);
