import { state } from "./state.js";

function enterEq(ele) {
  if (event.key === "Enter") {
    alert(ele.value);
  }
}

function zoomIn() {
  state.zoom *= 1.1;
}

function zoomOut() {
  state.zoom *= 0.9;
}
