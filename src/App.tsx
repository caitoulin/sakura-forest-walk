import React, { useEffect } from "react";
import { initializeSakuraScene } from "./index";
const App = () => {
  useEffect(() => {
    initializeSakuraScene("three-canvas");
  }, []);

  return (
    <div>
      <canvas id="three-canvas"></canvas>
    </div>
  );
};

export default App;
