import {
  RiBankFill,
  RiBox2Fill,
  RiBuilding3Fill,
  RiExpandUpDownFill,
  RiFundsFill,
  RiGameFill,
  RiGlasses2Fill,
  RiHandCoinFill,
  RiListOrdered2,
  RiPercentFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiScalesFill,
  RiShapesFill,
  RiSparkling2Fill,
  RiStackFill,
  RiTeamFill,
  RiTextWrap,
  RiTicket2Fill,
  RiUserFill,
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
  <div className="grid grid-cols-3 gap-1">
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
    {/* Prestige removed - not used in modern game */}
    <LegendItem symbol={<RiWallet3Fill />} label="Cash on Hand" />
    <LegendItem symbol={<RiScalesFill />} label="Net Worth" />
    <LegendItem symbol={<RiFundsFill />} label="Stock Price" />
    <LegendItem symbol={<RiGameFill />} label="Passive Effect" />
    <LegendItem symbol={<RiTeamFill />} label="Consumer" />
    <LegendItem symbol={<RiBankFill />} label="Bank" />
    <LegendItem symbol={<RiUserFill />} label="Player" />
  </div>
);

export default SymbolLegend;
