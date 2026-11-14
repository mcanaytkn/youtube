
import React from "react";
import {Composition} from "remotion";
import {
  MainVideo,
  MainVideoSub,
  FPS,
  TOTAL_FRAMES,
} from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />

      <Composition
        id="MainVideoSub"
        component={MainVideoSub}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
