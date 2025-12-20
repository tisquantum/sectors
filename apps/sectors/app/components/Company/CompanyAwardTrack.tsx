import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import CompanyComponent from "./Company";
import { useEffect } from "react";
import { AvatarGroup } from "@nextui-org/react";
import { RiGameFill, RiSparkling2Fill } from "@remixicon/react";
import { AwardTrackType } from "@server/prisma/prisma.client";

const CompanyAwardTrack = ({
  companyAwardTrackId,
}: {
  companyAwardTrackId: string;
}) => {
  const { currentPhase } = useGame();
  const {
    data: awardTrack,
    isLoading: isLoadingAwardTrack,
    isError: isErrorAwardTrack,
  } = trpc.companyAwardTrack.getCompanyAwardTrack.useQuery({
    id: companyAwardTrackId,
  });
  const {
    data: awardTrackSpaces,
    isLoading: isLoadingAwardTrackSpaces,
    isError: isErrorAwardTrackSpaces,
    refetch: refetchAwardTrackSpaces,
  } = trpc.companyAwardTrackSpace.listCompanyAwardTrackSpaces.useQuery({
    where: {
      awardTrackId: companyAwardTrackId,
    },
  });
  useEffect(() => {
    refetchAwardTrackSpaces();
  }, [currentPhase?.id, refetchAwardTrackSpaces]);
  const awardTrackDescription = (awardTrackType: AwardTrackType) => {
    switch (awardTrackType) {
      case AwardTrackType.RESEARCH:
        return "Every time the company selects a research action during operations advance one space on this track.";
      case AwardTrackType.MARKETING:
        return "Every time a company selects a marketing campaign action during operations advance one space on this track.";
      case AwardTrackType.CATALYST:
        return "Every time a company issues shares or lobbies during operations advance one space on this track.";
      default:
        return "Company award track description.";
    }
  };
  if (isLoadingAwardTrack || isLoadingAwardTrackSpaces)
    return <div> Loading... </div>;
  if (isErrorAwardTrack || isErrorAwardTrackSpaces) return <div> Error </div>;
  if (!awardTrack || !awardTrackSpaces) return;
  return (
    <div className="flex flex-col items-center p-6 rounded-lg shadow-lg">
      <h2 className="text-lg lg:text-2xl font-bold mb-4">
        {awardTrack.awardTrackName} Award Track
      </h2>
      <p className="text-sm lg:text-lg text-gray-400 mb-4">
        {awardTrackDescription(awardTrack.awardTrackType)}
      </p>
      <div className="flex flex-wrap gap-4 border-2 border-dashed border-gray-400 p-4 rounded-lg">
        {awardTrackSpaces.map((companyAwardTrackSpace) => {
          return (
            <div
              key={companyAwardTrackSpace.id}
              className="flex flex-col items-center justify-center bg-gray-600 w-20 h-20 rounded-lg shadow-md p-2"
            >
              <div className="text-lg font-semibold">
                {companyAwardTrackSpace.awardTrackSpaceNumber}
              </div>
              <div className="flex justify-center mt-2 gap-1">
                <AvatarGroup max={5}>
                  {companyAwardTrackSpace.companySpaces.map((companySpace) => (
                    <CompanyComponent
                      key={companySpace.id}
                      company={companySpace.Company}
                    />
                  ))}
                </AvatarGroup>
              </div>
              {companyAwardTrackSpace.awardTrackSpaceNumber ==
                awardTrackSpaces.length - 1 && (
                <div className="flex gap-1 text-lg font-semibold">
                  <RiSparkling2Fill />
                  <RiGameFill />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyAwardTrack;
