"use client";

import React, { useState } from "react";
import { useGame } from "./GameContext";
import { trpc } from "@sectors/app/trpc";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
} from "@nextui-org/react";
import {
  RiCalendarLine,
  RiShareBoxLine,
  RiTrophyFill,
  RiInformationLine,
} from "@remixicon/react";
import { Sector } from "@server/prisma/prisma.client";
import { sectorColors } from "@server/data/gameData";
import { toast } from "sonner";

interface ForecastQuarter {
  id: string;
  quarterNumber: number;
  shareCost: number;
  totalSharesCommitted: number;
  demandCounters: number;
  sectorId: string | null;
  isActive: boolean;
  commitments: Array<{
    id: string;
    playerId: string;
    shareCount: number;
    Sector: Sector;
    Player: { nickname: string };
  }>;
}

const ForecastPhase = () => {
  const { gameId, authPlayer, currentTurn, gameState, playersWithShares } = useGame();
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedShares, setSelectedShares] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch forecast quarters
  const {
    data: quarters,
    isLoading: quartersLoading,
    refetch: refetchQuarters,
  } = trpc.forecast.getQuarters.useQuery(
    { gameId: gameId || "" },
    { enabled: !!gameId }
  );

  // Get player's shares from playersWithShares
  const playerShares = React.useMemo(() => {
    if (!playersWithShares || !authPlayer?.id) return [];
    const authPlayerWithShares = playersWithShares.find(
      (p) => p.id === authPlayer.id
    );
    if (!authPlayerWithShares) return [];
    return authPlayerWithShares.Share.filter(
      (share) =>
        share.location === "PLAYER" &&
        !share.isCommitted &&
        !share.shortOrderId
    );
  }, [playersWithShares, authPlayer?.id]);

  // Fetch player's existing commitments
  const { data: playerCommitments } = trpc.forecast.getPlayerCommitments.useQuery(
    {
      gameId: gameId || "",
      gameTurnId: currentTurn?.id || "",
      playerId: authPlayer?.id || "",
    },
    {
      enabled: !!gameId && !!currentTurn?.id && !!authPlayer?.id,
    }
  );

  // Commit shares mutation
  const commitSharesMutation = trpc.forecast.commitShares.useMutation({
    onSuccess: () => {
      toast.success("Shares committed successfully!");
      refetchQuarters();
      setSelectedQuarter(null);
      setSelectedSector(null);
      setSelectedShares([]);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to commit shares");
    },
  });

  // Group shares by sector
  const sharesBySector = React.useMemo(() => {
    if (!playerShares || !gameState?.sectors) return {};
    const grouped: Record<string, { shares: any[]; sector: Sector }> = {};
    playerShares.forEach((share) => {
      // ShareWithCompany has Company relation
      const company = (share as any).Company;
      if (!company) return;
      const sectorId = company.sectorId;
      const sector = gameState.sectors?.find((s) => s.id === sectorId);
      if (!sector) return;
      if (!grouped[sectorId]) {
        grouped[sectorId] = {
          shares: [],
          sector: sector,
        };
      }
      grouped[sectorId].shares.push(share);
    });
    return grouped;
  }, [playerShares, gameState?.sectors]);

  const handleSelectQuarter = (quarterId: string, quarter: ForecastQuarter) => {
    // Check if player already committed to this quarter this turn
    const existingCommitment = playerCommitments?.find(
      (c) => c.quarterId === quarterId
    );
    if (existingCommitment) {
      toast.error("You have already committed to this quarter this turn");
      return;
    }

    setSelectedQuarter(quarterId);
    setSelectedSector(null);
    setSelectedShares([]);
    onOpen();
  };

  const handleSelectSector = (sectorId: string) => {
    setSelectedSector(sectorId);
    setSelectedShares([]);
  };

  const handleToggleShare = (shareId: string) => {
    if (!selectedQuarter || !selectedSector) return;

    const quarter = quarters?.find((q) => q.id === selectedQuarter);
    if (!quarter) return;

    if (selectedShares.includes(shareId)) {
      setSelectedShares(selectedShares.filter((id) => id !== shareId));
    } else {
      // Check if adding this share would exceed quarter cost
      if (selectedShares.length >= quarter.shareCost) {
        toast.error(
          `Cannot commit more than ${quarter.shareCost} shares to this quarter`
        );
        return;
      }
      setSelectedShares([...selectedShares, shareId]);
    }
  };

  const handleCommitShares = () => {
    if (!selectedQuarter || !selectedSector || selectedShares.length === 0) {
      toast.error("Please select a quarter, sector, and shares");
      return;
    }

    if (!authPlayer?.id) {
      toast.error("Player not found");
      return;
    }

    commitSharesMutation.mutate({
      gameId: gameId || "",
      playerId: authPlayer.id,
      quarterId: selectedQuarter,
      sectorId: selectedSector,
      shareIds: selectedShares,
    });
  };

  if (quartersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Initialize quarters mutation
  const initializeQuartersMutation = trpc.forecast.initializeQuarters.useMutation({
    onSuccess: () => {
      refetchQuarters();
      toast.success("Forecast quarters initialized!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initialize quarters");
    },
  });

  if (!quarters || quarters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-400">No forecast quarters found.</p>
        <Button
          onClick={() => {
            initializeQuartersMutation.mutate({
              gameId: gameId || "",
            });
          }}
          isLoading={initializeQuartersMutation.isPending}
        >
          Initialize Quarters
        </Button>
      </div>
    );
  }

  // Sort quarters by quarter number
  const sortedQuarters = [...quarters].sort(
    (a, b) => a.quarterNumber - b.quarterNumber
  );

  // Get rankings for display (sorted by demand counters)
  const rankedQuarters = [...quarters]
    .filter((q) => q.demandCounters > 0)
    .sort((a, b) => b.demandCounters - a.demandCounters);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RiCalendarLine size={28} />
            Forecast Quarters
          </h2>
          <p className="text-gray-400 mt-1">
            Commit shares from one sector to forecast quarters. Each quarter has
            a different share cost.
          </p>
        </div>
      </div>

      {/* Rankings */}
      {rankedQuarters.length > 0 && (
        <Card className="bg-gray-800/50 border border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <RiTrophyFill className="text-yellow-500" />
              Current Rankings
            </h3>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              {rankedQuarters.slice(0, 3).map((quarter, index) => {
                const sector = gameState?.sectors?.find(
                  (s) => s.id === quarter.sectorId
                );
                const rank = index + 1;
                const percentage =
                  rank === 1 ? "50%" : rank === 2 ? "30%" : "20%";
                return (
                  <div
                    key={quarter.id}
                    className="flex-1 bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Chip
                        color={
                          rank === 1
                            ? "warning"
                            : rank === 2
                            ? "secondary"
                            : "default"
                        }
                        size="sm"
                      >
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"} {rank}
                        {rank === 1 ? "st" : rank === 2 ? "nd" : "rd"}
                      </Chip>
                      {quarter.isActive && (
                        <Chip color="success" size="sm">
                          Active
                        </Chip>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {sector?.name || "Multiple Sectors"}
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {quarter.demandCounters}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Demand Counters
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Gets {percentage} of economy score
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quarters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedQuarters.map((quarter) => {
          const sector = gameState?.sectors?.find(
            (s) => s.id === quarter.sectorId
          );
          const playerCommitment = playerCommitments?.find(
            (c) => c.quarterId === quarter.id
          );
          const canCommit =
            !playerCommitment &&
            authPlayer?.id &&
            sharesBySector &&
            Object.keys(sharesBySector).length > 0;

          return (
            <Card
              key={quarter.id}
              className={`bg-gray-800/50 border-2 ${
                quarter.isActive
                  ? "border-yellow-500"
                  : "border-gray-700"
              } hover:border-gray-600 transition-colors`}
            >
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-xl font-bold">
                    Quarter {quarter.quarterNumber}
                  </h3>
                  {quarter.isActive && (
                    <Chip color="warning" size="sm">
                      Active
                    </Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <RiShareBoxLine size={16} />
                  <span>Cost: {quarter.shareCost} shares</span>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Shares Committed
                  </div>
                  <div className="text-2xl font-bold">
                    {quarter.totalSharesCommitted}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Demand Counters
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {quarter.demandCounters}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    = {quarter.totalSharesCommitted} ÷ {quarter.shareCost}
                  </div>
                </div>
                {sector && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Sector</div>
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: sectorColors[sector.sectorName] || "#gray",
                      }}
                    >
                      {sector.name}
                    </Chip>
                  </div>
                )}
                {playerCommitment && (
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">
                      Your Commitment
                    </div>
                    <div className="text-sm">
                      {playerCommitment.shareCount} shares from{" "}
                      {playerCommitment.Sector.name}
                    </div>
                  </div>
                )}
                {canCommit && (
                  <Button
                    size="sm"
                    color="primary"
                    className="w-full"
                    onClick={() => handleSelectQuarter(quarter.id, quarter)}
                  >
                    Commit Shares
                  </Button>
                )}
                {!canCommit && !playerCommitment && (
                  <div className="text-xs text-gray-500 text-center">
                    No shares available to commit
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Commit Shares Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Commit Shares to Quarter</ModalHeader>
          <ModalBody>
            {selectedQuarter && (
              <>
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">
                    Selected Quarter: Q
                    {quarters?.find((q) => q.id === selectedQuarter)
                      ?.quarterNumber}
                  </div>
                  <div className="text-sm text-gray-400">
                    Maximum shares:{" "}
                    {quarters?.find((q) => q.id === selectedQuarter)?.shareCost}
                  </div>
                </div>

                {!selectedSector ? (
                  <div>
                    <div className="text-sm font-medium mb-3">
                      Select a Sector
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(sharesBySector).map(
                        ([sectorId, { sector, shares }]) => {
                          // Check if player has president certificate (20% or more)
                          const companyIds = [
                            ...new Set(shares.map((s) => s.companyId)),
                          ];
                          let hasPresidentCert = false;
                          // Note: This is a simplified check - in production you'd want to check each company
                          const availableShares = shares.filter(
                            (s) => !s.isCommitted
                          );

                          return (
                            <Button
                              key={sectorId}
                              variant="bordered"
                              className="h-auto p-4 flex flex-col items-start"
                              onClick={() => handleSelectSector(sectorId)}
                              isDisabled={availableShares.length === 0}
                            >
                              <div className="font-medium">{sector.name}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {availableShares.length} shares available
                              </div>
                            </Button>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium">
                        Select Shares from{" "}
                        {sharesBySector[selectedSector]?.sector.name}
                      </div>
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => {
                          setSelectedSector(null);
                          setSelectedShares([]);
                        }}
                      >
                        Change Sector
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {sharesBySector[selectedSector]?.shares
                        .filter((s) => !s.isCommitted)
                        .map((share) => {
                          const company = (share as any).Company;
                          const isSelected = selectedShares.includes(share.id);
                          return (
                            <div
                              key={share.id}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500/10"
                                  : "border-gray-700 hover:border-gray-600"
                              }`}
                              onClick={() => handleToggleShare(share.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {company?.name || "Unknown"} ({company?.stockSymbol || "??"})
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {sharesBySector[selectedSector]?.sector.name || "Unknown Sector"}
                                  </div>
                                </div>
                                <Checkbox isSelected={isSelected} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      Selected: {selectedShares.length} /{" "}
                      {quarters?.find((q) => q.id === selectedQuarter)
                        ?.shareCost}{" "}
                      shares
                    </div>
                  </div>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCommitShares}
              isDisabled={
                !selectedQuarter ||
                !selectedSector ||
                selectedShares.length === 0 ||
                commitSharesMutation.isPending
              }
              isLoading={commitSharesMutation.isPending}
            >
              Commit {selectedShares.length} Share
              {selectedShares.length !== 1 ? "s" : ""}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Info Section */}
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <RiInformationLine />
            How Forecast Works
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-2 text-sm text-gray-300">
            <div>
              • Each quarter has a different share cost: Q1 = 4 shares, Q2 = 3
              shares, Q3 = 2 shares, Q4 = 1 share
            </div>
            <div>
              • You can commit shares from companies in one sector per quarter
            </div>
            <div>
              • Once committed, shares cannot be sold during your stock round
            </div>
            <div>
              • President certificates (20% ownership) cannot be committed
            </div>
            <div>
              • Demand counters = Total shares committed ÷ Quarter cost
            </div>
            <div>
              • At end of turn, quarters shift left (Q1 becomes active, Q2→Q1,
              Q3→Q2, Q4→Q3, new Q4)
            </div>
            <div>
              • Active quarter (highest demand) gets 50% of economy score, 2nd
              gets 30%, 3rd gets 20%
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ForecastPhase;
