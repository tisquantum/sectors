import { Company } from "@server/prisma/prisma.client";

const CompanyComponent: React.FC<{ company: Company }> = ({ company }) => {
    return (
        <div>
            <h1>{company.name}</h1>
        </div>
    );
}

export default CompanyComponent;