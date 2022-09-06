import logo from "./logo.svg";
import "./App.css";
import React from "react";
import * as d3 from "d3";
import data from "./2021_philvolcs_filtered.csv";
import phGeoJsonData from "./phl_regions2.geojson";

import { ScatterPlot } from "./Visualizations/ScatterPlot";
import PhMap from "./Visualizations/PhMap";
import DensityPlot from "./Visualizations/DensityPlot";
import Slider from "react-rangeslider";

function App() {
  let geoJsonData = React.useRef(false);
  let phlVolcData = React.useRef(false);
  let dateList = React.useRef([]);

  const [dataState, setDataState] = React.useState(false);
  const [sliderState, setSliderState] = React.useState(0);

  const [pause, setPause] = React.useState(true);
  const parseDate = d3.utcParse("%Y-%m-%d");

  React.useMemo(() => {
    console.log("react is running");
    const getData = async () => {
      Promise.all([d3.csv(data), d3.json(phGeoJsonData)]).then((result) => {
        // Geo Data (create d3 projection)
        geoJsonData.current = result[1];

        // Volcanic Data
        let projection = d3.geoMercator().fitSize([780, 980], result[1]);

        phlVolcData.current = result[0]
          .map((d) => {
            let t = projection([parseFloat(d.long), parseFloat(d.lat)]);
            return { ...d, x: t[0], y: t[1], date: parseDate(d.date) };
          })
          .sort((a, b) => a.date - b.date);

        dateList.current = generateDateList(
          new Date(2021, 0, 1),
          new Date(2021, 11, 31)
        );

        setDataState(true);
      });
    };

    getData();
  }, []);

  const counter = () => {
    var countdown = setInterval(() => {
      console.log(sliderState, dateList.current.length, dateList.length);
      if (sliderState >= dateList.current.length - 1) {
        console.log("being called");
        setSliderState(0);
        setPause(true);
        clearInterval(countdown);
        return;
      }

      if (pause === true) {
        clearInterval(countdown);
        return;
      }

      setSliderState((sliderState) => sliderState + 1);
    }, 100);
    return () => {
      clearInterval(countdown);
    };
  };

  const generateDateList = (startDate, stopDate) => {
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

  const pauseCounter = () => {
    setPause(true);
  };

  const resumeCounter = () => {
    setPause(false);
    // setSliderState((sliderState) => sliderState + 1);
  };

  const handleSliderChange = (value) => {
    setSliderState(value);
  };

  React.useEffect(counter, [sliderState, pause]);

  return (
    <div className="App">
      <h1>Earthquakes in the philippines</h1>

      <div className="slider">
        <Slider
          min={0}
          max={dateList.current.length}
          value={sliderState}
          onChange={handleSliderChange}
        />
      </div>
      <button onClick={() => resumeCounter()}> Resume</button>
      <button onClick={pauseCounter}>Pause</button>

      {dataState && dateList.current[sliderState].toDateString()}
      {dataState && (
        <div className={"charts"}>
          <DensityPlot
            width={800}
            height={1000}
            margin={{ top: 10, left: 10, right: 10, bottom: 10 }}
            data={phlVolcData.current}
            currentDate={dateList.current[sliderState]}
          />
          <PhMap
            width={800}
            height={1000}
            margin={{ top: 10, left: 10, right: 10, bottom: 10 }}
            data={phlVolcData.current}
            currentDate={dateList.current[sliderState]}
            geojson={geoJsonData.current}
          />
        </div>
      )}
    </div>
  );
}

export default App;
