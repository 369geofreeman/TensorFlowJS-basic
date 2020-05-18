import React, { useReducer, useState, useRef } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./App.css";

const stateMachine = {
  initial: "initial",
  states: {
    initial: { on: { next: "loadingModal" } },
    loadingModal: { on: { next: "awaitingUpload" } },
    awaitingUpload: { on: { next: "ready" } },
    ready: { on: { next: "classify" }, showImage: true },
    classify: { on: { next: "complete" } },
    complete: {
      on: { next: "awaitingUpload" },
      showImage: true,
      showResults: true,
    },
  },
};

const reducer = (currentState, event) =>
  stateMachine.states[currentState].on[event] || stateMachine.initial;

const formatResult = ({ className, probability }) => (
  <li key={className}>{`${className} ${(probability * 100).toFixed(2)}%`}</li>
);

function App() {
  const [state, dispatch] = useReducer(reducer, stateMachine.initial);
  const [modal, setModal] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [results, setResults] = useState([]);
  const imageRef = useRef();
  const inputRef = useRef();

  const next = () => dispatch("next");

  const loadModal = async () => {
    next();
    const mobilenetModal = await mobilenet.load();
    setModal(mobilenetModal);
    next();
  };

  const handleUpload = (e) => {
    const { files } = e.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setImgUrl(url);
      next();
    }
  };

  const identify = async () => {
    next();
    const results = await modal.classify(imageRef.current);
    setResults(results);
    next();
  };

  const reset = () => {
    setResults([]);
    setImgUrl(null);
    next();
  };

  const buttonProps = {
    initial: { text: "Load Modal", action: loadModal },
    loadingModal: { text: "Loading modal...", action: () => {} },
    awaitingUpload: {
      text: "Upload Photo",
      action: () => inputRef.current.click(),
    },
    ready: { text: "Identify", action: identify },
    classify: { text: "Classifying", action: () => {} },
    complete: { text: "Reset", action: reset },
  };

  const { showImage = false, showResults = false } = stateMachine.states[state];

  return (
    <div>
      {showImage && <img alt="upload-preview" src={imgUrl} ref={imageRef} />}
      {showResults && <ul>{results.map(formatResult)}</ul>}
      <input
        type="file"
        accept="image/*"
        capture="camera"
        ref={inputRef}
        onChange={handleUpload}
      />
      <button onClick={buttonProps[state].action}>
        {buttonProps[state].text}
      </button>
    </div>
  );
}

export default App;
