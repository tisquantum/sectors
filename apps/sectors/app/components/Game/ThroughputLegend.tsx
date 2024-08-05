import { RiIncreaseDecreaseFill } from "@remixicon/react";
import {
  throughputRewardOrPenalty,
  ThroughputRewardType,
} from "@server/data/constants";

const ThroughputLegend = () => (
  <>
    <h2 className="text-lg font-semibold mb-2">Throughput Legend</h2>
    <div className="grid grid-cols-2">
      {
        //iterate from 0 to 7 in for each
        Array.from(Array(8).keys()).map((throughput) => {
          const throughputReward = throughputRewardOrPenalty(throughput);
          return (
            <div key={throughput} className="flex items-center gap-2 mb-1">
              <span className="font-medium flex items-center gap-1">
                <RiIncreaseDecreaseFill size={18} /> {throughput}:
              </span>
              <span>
                {throughputReward.type === ThroughputRewardType.SECTOR_REWARD
                  ? "Share Steps + 1"
                  : `Share Steps ${
                      throughputReward.share_price_steps_down == 0
                        ? "0"
                        : "-" + throughputReward.share_price_steps_down
                    }`}
              </span>
            </div>
          );
        })
      }
    </div>
  </>
);

export default ThroughputLegend;
