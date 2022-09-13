import logo from "./logo.svg";
import "./App.css";
import React from "react";
import Visualizations from "./Visualizations/Visualizations";

const DataArea = ({ date, data }) => {
  return <h1>{date.toString()}</h1>;
};

function App() {

  return (
    <div style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
      <Visualizations />
    </div>
  );
}

export default App;
