import { useState, useEffect } from "react";

export function useWindowResize() {
  const [windowHeight, setWindowHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowHeight;
}
