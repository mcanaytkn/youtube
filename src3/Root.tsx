import React from "react";
import {Composition} from "remotion";
import {MainVideo, FPS, TOTAL_FRAMES} from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SelfWorth"
      component={MainVideo}
      durationInFrames={TOTAL_FRAMES} // 14400 = 8:00 at 30fps
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};