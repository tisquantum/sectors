import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { OrderType, ShareLocation } from "@server/prisma/prisma.client";
import { PlayerOrderWithCompany } from "@server/prisma/prisma.types";

const renderBasedOnOrderType = (playerOrder: PlayerOrderWithCompany) => {
    if (playerOrder.orderType === OrderType.MARKET) {
        return (
            <div>
                <div>Quantity: {playerOrder.quantity}</div>
                {playerOrder.isSell ? <div>Sell</div> : <div>Buy</div>}
                {playerOrder.location == ShareLocation.IPO && <div> IPO Price: {playerOrder.Company.ipoAndFloatPrice}</div>}
                {playerOrder.location == ShareLocation.OPEN_MARKET && <div> Current Price: {playerOrder.Company.currentStockPrice}</div>}
            </div>
        );
    } else if (playerOrder.orderType === OrderType.LIMIT) {
        return (
            <div>
                <div>Quantity: {playerOrder.quantity}</div>
                {playerOrder.isSell ? <div>Sell</div> : <div>Buy</div>}
                <div>Limit Price: {playerOrder.value}</div>
            </div>
        );
    } else if (playerOrder.orderType === OrderType.SHORT) {
        return (
            <div>
                <div>Term: {playerOrder.term}</div>
                <div>Quantity: {playerOrder.quantity}</div>
            </div>
        );
    }
}

const PlayerCurrentQueuedOrders = () => {
    const { currentPhase } = useGame();
    const { data: playerOrders, isLoading } = trpc.playerOrder.listPlayerOrdersWithCompany.useQuery({
        where: { stockRoundId: currentPhase?.stockRoundId },
    });

    if (isLoading) return <div>Loading...</div>;
    if (playerOrders == undefined) return null;

    return (
        <div>
            <h3>Current Queued Orders</h3>
            {playerOrders.map((playerOrder) => (
                <Card>
                    <CardHeader>{playerOrder.Company.name}</CardHeader>
                    <CardBody>
                        <div>Type: {playerOrder.orderType}</div>
                        {renderBasedOnOrderType(playerOrder)}
                    </CardBody>
                </Card>
            ))}
        </div>
    );
}

export default PlayerCurrentQueuedOrders;