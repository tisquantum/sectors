import {
  RiBox2Fill,
  RiBuilding3Fill,
  RiExpandUpDownFill,
  RiFundsFill,
  RiGlasses2Fill,
  RiHandCoinFill,
  RiListOrdered2,
  RiPercentFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiShapesFill,
  RiSparkling2Fill,
  RiStackFill,
  RiTextWrap,
  RiTicket2Fill,
  RiWallet3Fill,
} from "@remixicon/react";

const LegendItem = ({
  symbol,
  label,
}: {
  symbol: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-1">
    {symbol}
    <div>{label}</div>
  </div>
);

const SymbolLegend = () => (
  <div className="grid grid-cols-2 gap-1">
    <LegendItem symbol={<RiListOrdered2 />} label="Game Turn" />
    <LegendItem symbol={<RiTextWrap />} label="Game Phase" />
    <LegendItem symbol={<RiShapesFill />} label="Sector" />
    <LegendItem symbol={<RiBuilding3Fill />} label="Company" />
    <LegendItem symbol={<RiStackFill />} label="Company Tier" />
    <LegendItem symbol={<RiSailboatFill />} label="Company Float" />
    <LegendItem symbol={<RiExpandUpDownFill />} label="Operations Cost" />
    <LegendItem symbol={<RiPriceTag3Fill />} label="Unit Price" />
    <LegendItem symbol={<RiHandCoinFill />} label="Supply" />
    <LegendItem symbol={<RiBox2Fill />} label="Demand" />
    <LegendItem symbol={<RiGlasses2Fill />} label="Research Card" />
    <LegendItem symbol={<RiPercentFill />} label="Percentage" />
    <LegendItem symbol={<RiTicket2Fill />} label="Share" />
    <LegendItem symbol={<RiSparkling2Fill />} label="Prestige" />
    <LegendItem symbol={<RiWallet3Fill />} label="Cash on Hand" />
    <LegendItem symbol={<RiFundsFill />} label="Stock Price" />
  </div>
);

export default SymbolLegend;
