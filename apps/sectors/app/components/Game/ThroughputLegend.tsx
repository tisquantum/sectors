import { RiIncreaseDecreaseFill } from "@remixicon/react";
import {
  throughputRewardOrPenalty,
  ThroughputRewardType,
} from "@server/data/constants";

const ThroughputLegend = () => (
  <>
    <thead>
      <tr className="text-gray-200">
        <th className="py-2 px-4 border-b">Throughput</th>
        <th className="py-2 px-4 border-b">Stock Price Adjusment</th>
      </tr>
    </thead>
    <tbody>
      {
        //iterate from 0 to 7 in for each
        Array.from(Array(8).keys()).map((throughput, index) => {
          const throughputReward = throughputRewardOrPenalty(throughput);
          return (
            <tr
              key={throughput}
              className={`text-center ${
                index % 2 === 0 ? "bg-black" : "bg-grey-800"
              }`}
            >
              <td>
                <div className="flex justify-center">
                  <span className="font-medium flex items-center gap-1">
                    <RiIncreaseDecreaseFill size={18} /> {throughput}
                  </span>
                </div>
              </td>
              <td>
                <div className="flex justify-center">
                  <span>
                    {throughputReward.type ===
                    ThroughputRewardType.SECTOR_REWARD
                      ? "+ 1"
                      : `${
                          throughputReward.share_price_steps_down == 0
                            ? "0"
                            : "-" + throughputReward.share_price_steps_down
                        }`}
                  </span>
                </div>
              </td>
            </tr>
          );
        })
      }
    </tbody>
  </>
);

export default ThroughputLegend;
