import {
  Accordion,
  AccordionItem,
  Avatar,
  AvatarGroup,
  Badge,
} from "@nextui-org/react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";
import { Company } from "@server/prisma/prisma.client";

const CompaniesAccordion = ({ companies }: { companies: Company[] }) => {
  return (
    <Accordion selectionMode="multiple">
      {companies.map((company: Company) => {
        const isPriceUp = (company.currentStockPrice || 0) > 0; //company.previousStockPrice;
        const trendIcon = isPriceUp ? (
          <ArrowUpIcon className="size-4 text-green-500" />
        ) : (
          <ArrowDownIcon className="size-4 text-red-500" />
        );

        return (
          <AccordionItem
            key={company.id}
            aria-label={company.name}
            startContent={
              <Avatar
                isBordered
                color="primary"
                radius="lg"
                name={company.name}
              />
            }
            subtitle={
              <div className="flex items-center">
                {trendIcon}
                <span className="ml-1">${company.currentStockPrice || 0}</span>
                <BoltIcon className="ml-2 size-4 text-yellow-500" />
                <span className="ml-1">5</span>
                <AvatarGroup isGrid className="ml-4" max={3}>
                  <Badge content="5" color="default">
                    <Avatar name="OM" />
                  </Badge>
                  <Badge content="2" color="default">
                    <Avatar name="IPO" />
                  </Badge>
                  <Badge content="1" color="default">
                    <Avatar
                      src={`https://i.pravatar.cc/150?u=Player3`}
                      name="Player 3"
                    />
                  </Badge>
                  <Badge content="1" color="default">
                    <Avatar
                      src={`https://i.pravatar.cc/150?u=Player2`}
                      name="Player 4"
                    />
                  </Badge>
                </AvatarGroup>
              </div>
            }
            title={company.name}
            isCompact
          >
            <div className="p-4">
              <p>
                <strong>Cash on Hand:</strong> ${company.cashOnHand || 0}
              </p>
              <p>
                <strong>Throughput:</strong> {company.throughput}
              </p>
              <p>
                <strong>Insolvent:</strong> {company.insolvent ? "Yes" : "No"}
              </p>
              <p>
                <strong>IPO Price (Float Price):</strong> $
                {company.ipoAndFloatPrice}
              </p>
            </div>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default CompaniesAccordion;
