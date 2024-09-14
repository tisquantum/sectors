import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { Company } from "@server/prisma/prisma.client";
import CompanyInfo from "./CompanyInfo";

const CompanyComponent: React.FC<{ company: Company }> = ({ company }) => {
  return (
    <div>
      <Popover>
        <Badge color="success" content={company.stockSymbol}>
          <PopoverTrigger>
            <Avatar name={company.stockSymbol} />
          </PopoverTrigger>
        </Badge>
        <PopoverContent>
          <CompanyInfo companyId={company.id} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CompanyComponent;
