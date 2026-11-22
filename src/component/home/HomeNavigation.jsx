import React from "react";
import GlassNavbar from "../navbar/GlassNavbar";

export default function HomeNavigation({ onSkipNotes }) {
  return <GlassNavbar variant="home" onSkipNotes={onSkipNotes} />;
}
