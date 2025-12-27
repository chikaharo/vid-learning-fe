// React 19 removes the default export from react-dom. Some third-party
// libraries (like react-quill@2) still expect the default export to exist and
// expose findDOMNode from it. This shim restores a compatible default export
// so those libraries keep working until they update for React 19.
import * as ReactDOM from "react-dom";

const dom = ReactDOM as unknown as {
	default?: typeof ReactDOM & { findDOMNode?: (...args: any) => any };
};

if (!dom.default) {
	dom.default = ReactDOM as any;
}

// In React 19, findDOMNode is removed. We polyfill it to avoid crashes in
// libraries that still rely on it. This basic polyfill returns the component
// instance itself. This may not work for all cases but prevents the app from crashing.
if (dom.default && !dom.default.findDOMNode) {
	dom.default.findDOMNode = (instance: any) => instance;
}

export {};
