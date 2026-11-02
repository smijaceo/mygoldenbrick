import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Libre_Caslon_Display } from "next/font/google";
import { MotionExperience } from "./experience";
import "./prototype.css";

// Big Shoulders was drawn for a city's buildings, and its tall capitals stand up well in bricks.
const shoulders = Big_Shoulders({ subsets: ["latin", "latin-ext"], variable: "--font-shoulders", weight: ["700", "800"] });
// Kept for the wordmark beside the logo, as on the landing page in progress.
const caslon = Libre_Caslon_Display({ subsets: ["latin"], variable: "--font-caslon", weight: "400" });

export const metadata: Metadata = {
  title: { absolute: "My Golden Brick: motion prototype" },
  description: "Build on your name. A real estate website, and one place for every buyer inquiry.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#17183a",
  colorScheme: "dark",
};

export default function MotionPrototypePage() {
  return (
    <div className={`${shoulders.variable} ${caslon.variable}`}>
      <MotionExperience fontFamily={shoulders.style.fontFamily} />
    </div>
  );
}
