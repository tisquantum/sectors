import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  RiFundsFill,
  RiIncreaseDecreaseFill,
  RiStockLine,
} from "@remixicon/react";
import {
  PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION,
  throughputRewardOrPenalty,
  ThroughputRewardType,
} from "@server/data/constants";

const ThroughputLegend = () => (
  <>
    <Table>
      <TableHeader>
        <TableColumn>Throughput</TableColumn>
        <TableColumn>Reward | Penalty</TableColumn>
      </TableHeader>
      <TableBody>
        {
          //iterate from 0 to 7 in for each
          Array.from(Array(8).keys()).map((throughput, index) => {
            const throughputReward = throughputRewardOrPenalty(throughput);
            return (
              <TableRow
                key={throughput}
                className={`text-center ${
                  index % 2 === 0 ? "bg-black" : "bg-grey-800"
                }`}
              >
                <TableCell>
                  <div className="flex justify-center">
                    <span className="font-medium flex items-center gap-1">
                      <RiIncreaseDecreaseFill size={18} /> {throughput}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    {throughputReward.type ===
                    ThroughputRewardType.SECTOR_REWARD ? (
                      `%${PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION} Operation Cost Reduction`
                    ) : (
                      <span className="flex gap-1">
                        <RiFundsFill />
                        {throughputReward.share_price_steps_down == 0
                          ? 0
                          : "-" + throughputReward.share_price_steps_down}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        }
      </TableBody>
    </Table>
  </>
);

export default ThroughputLegend;
