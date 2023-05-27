import { ErrorOutline } from "@mui/icons-material";
import { Typography } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
  return (
    <div className="notFound">
      <div className="notFoundContainer">
        <ErrorOutline style={{color: "red" }}/>
        <Typography variant="h2" style={{ padding: "2vmax", color: "#390083", fontWeight: "bold" }}>
          Page Not Found
        </Typography>

        <Link to="/">
          <Typography variant="h5">Go to Home</Typography>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
