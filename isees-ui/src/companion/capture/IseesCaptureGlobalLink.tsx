import { Link } from "react-router-dom";
import captureIcon from "../../../isees-capture-extension/icons/isees-capture.svg";
import "./IseesCaptureGlobalLink.css";

export default function IseesCaptureGlobalLink() {
  return (
    <Link
      className="capture-global-link"
      to="/capture"
      aria-label="Learn about iSEES Capture"
      title="iSEES Capture"
    >
      <img src={captureIcon} alt="" aria-hidden="true" />
      <span>Capture</span>
    </Link>
  );
}
