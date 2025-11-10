// React 19 removes the default export from react-dom. Some third-party
// libraries (like react-quill@2) still expect the default export to exist and
// expose findDOMNode from it. This shim restores a compatible default export
// so those libraries keep working until they update for React 19.
import * as ReactDOM from "react-dom";

const dom = ReactDOM as unknown as {
	default?: typeof ReactDOM;
	findDOMNode?: typeof ReactDOM.findDOMNode;
};

if (!dom.default) {
	dom.default = ReactDOM;
}

if (!dom.default.findDOMNode) {
	dom.default.findDOMNode = ReactDOM.findDOMNode;
}

if (typeof dom.findDOMNode === "function" && !dom.default.findDOMNode) {
	dom.default.findDOMNode = dom.findDOMNode;
}

export {};
