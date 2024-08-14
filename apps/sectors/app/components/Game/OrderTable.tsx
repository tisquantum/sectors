import React from 'react';
import { CompanyWithRelations, PlayerOrderWithPlayerCompany } from '@server/prisma/prisma.types';
import {
  RiFundsFill,
  RiPriceTag3Fill,
  RiWallet3Fill,
  RiTeamFill,
  RiBox2Fill,
  RiIncreaseDecreaseFill,
} from '@remixicon/react';
import { Button } from '@nextui-org/react';
import { ShareLocation } from '@server/prisma/prisma.client';

type PlayerOrderTableProps = {
  company: CompanyWithRelations;
  orders: PlayerOrderWithPlayerCompany[];
  isRevealRound: boolean;
  isInteractive: boolean;
  focusedOrder?: CompanyWithRelations;
  handleDisplayOrderInput: (company: CompanyWithRelations, isIpo?: boolean) => void;
};

const OrderTable: React.FC<PlayerOrderTableProps> = ({
  company,
  orders,
  isRevealRound,
  isInteractive,
  focusedOrder,
  handleDisplayOrderInput,
}) => {
  const ipoOrders = orders.filter((order) => order.location === ShareLocation.IPO);
  const openMarketOrders = orders.filter((order) => order.location === ShareLocation.OPEN_MARKET);

  return (
    <table className="min-w-full border-collapse border">
      <thead>
        <tr>
          <th className="py-2 px-4 border">Order Type</th>
          <th className="py-2 px-4 border">Phase</th>
          <th className="py-2 px-4 border">Quantity</th>
          <th className="py-2 px-4 border">Price</th>
          <th className="py-2 px-4 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {isRevealRound && (
          <>
            {ipoOrders.map((order, index) => (
              <tr key={index} className="p-4 border rounded shadow">
                <td className="py-2 px-4 border">IPO</td>
                <td className="py-2 px-4 border">{order.Phase.name}</td>
                <td className="py-2 px-4 border">{order.quantity}</td>
                <td className="py-2 px-4 border">${order.value}</td>
                <td className="py-2 px-4 border">
                  {isInteractive && (
                    <Button
                      onClick={() => handleDisplayOrderInput(company, true)}
                      className={focusedOrder?.id === company.id ? 'bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg' : 'ring-2 ring-gray-950'}
                    >
                      Place Order IPO
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {openMarketOrders.map((order, index) => (
              <tr key={index} className="p-4 border rounded shadow">
                <td className="py-2 px-4 border">Open Market</td>
                <td className="py-2 px-4 border">{order.Phase.name}</td>
                <td className="py-2 px-4 border">{order.quantity}</td>
                <td className="py-2 px-4 border">${order.value}</td>
                <td className="py-2 px-4 border">
                  {isInteractive && (
                    <Button
                      onClick={() => handleDisplayOrderInput(company, false)}
                      className={focusedOrder?.id === company.id ? 'bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg' : 'ring-2 ring-gray-950'}
                    >
                      Place Order Open Market
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  );
};

export default OrderTable;
