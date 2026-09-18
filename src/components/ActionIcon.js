import React from "react";

const paths = {
  download: "M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z",
  back: "M9.707 4.293a1 1 0 010 1.414L6.414 9H17a1 1 0 110 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z",
  calendar: "M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM4 9v7h12V9H4z",
  chevron: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
  reset: "M4 3a1 1 0 011 1v1.101A7 7 0 1110 17a1 1 0 110-2 5 5 0 10-3.536-8.536L8 8H3V3a1 1 0 011-1v1z",
  document: "M4 4a2 2 0 012-2h5.586A2 2 0 0113 2.586L16.414 6A2 2 0 0117 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm7-1v4h4l-4-4zM7 10a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h4a1 1 0 100-2H7z",
};

export default function ActionIcon({ name, size = 16, className = "" }) {
  return <svg className={`action-icon ${className}`} viewBox="0 0 20 20" fill="currentColor" width={size} height={size} aria-hidden="true" focusable="false"><path fillRule="evenodd" clipRule="evenodd" d={paths[name] || paths.document} /></svg>;
}
