import React, { useState } from "react";
import { Avatar, AvatarGroup, Divider } from "@nextui-org/react";

const StockChart = () => {
  const columns = 10; // Define the number of columns
  const rows = 10; // Adjust the number of rows based on your grid requirements
  const gridValues = [];
  const initialCompanies = [
    {
      id: 1,
      name: "TechCorp",
      position: { row: 0, col: 0 },
      avatar: "/path/to/avatar1.jpg",
    },
    {
      id: 2,
      name: "HealthInc",
      position: { row: 2, col: 3 },
      avatar: "/path/to/avatar2.jpg",
    },
    {
      id: 3,
      name: "Retailers",
      position: { row: 4, col: 5 },
      avatar: "/path/to/avatar3.jpg",
    },
    {
      id: 4,
      name: "FoodCo",
      position: { row: 4, col: 5 },
      avatar: "/path/to/avatar4.jpg",
    },
    {
      id: 5,
      name: "EnergyCorp",
      position: { row: 6, col: 7 },
      avatar: "/path/to/avatar5.jpg",
    },
  ];

  const unfloatedCompanies = [
    {
      id: 6,
      name: "TechCorp",
      avatar: "/path/to/avatar1.jpg",
      minFloat: 100,
      maxFloat: 200,
    },
    {
      id: 7,
      name: "HealthInc",
      avatar: "/path/to/avatar2.jpg",
      minFloat: 200,
      maxFloat: 400,
    },
    {
      id: 8,
      name: "Retailers",
      avatar: "/path/to/avatar3.jpg",
      minFloat: 300,
      maxFloat: 400,
    },
    {
      id: 9,
      name: "FoodCo",
      avatar: "/path/to/avatar4.jpg",
      minFloat: 100,
      maxFloat: 200,
    },
    {
      id: 10,
      name: "EnergyCorp",
      avatar: "/path/to/avatar5.jpg",
      minFloat: 100,
      maxFloat: 200,
    },
  ];

  const [companies, setCompanies] = useState(initialCompanies);
  const [highlightRange, setHighlightRange] = useState({
    min: null,
    max: null,
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  // Function to calculate the next value based on the provided formula
  const getNextValue = (currentValue) => {
    return Math.ceil(currentValue + currentValue / 100 + 5);
  };

  // Initialize the first value
  let currentValue = 0;

  // Generate the grid values
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < columns; j++) {
      row.push(currentValue);
      currentValue = getNextValue(currentValue);
    }
    gridValues.push(row);
  }

  // Handle click on unfloated company to highlight its range
  const handleUnfloatedCompanyClick = (companyId, minFloat, maxFloat) => {
    setHighlightRange({ min: minFloat, max: maxFloat });
    setSelectedCompanyId(companyId);
  };
  
  return (
    <>
      <div className="grid grid-cols-10 gap-3 p-4">
        {gridValues.flat().map((value, index) => {
          const row = Math.floor(index / columns);
          const col = index % columns;
          const companiesOnCell = companies.filter(
            (company) =>
              company.position.row === row && company.position.col === col
          );

          const isHighlighted =
            highlightRange.min !== null &&
            highlightRange.max !== null &&
            value >= highlightRange.min &&
            value <= highlightRange.max;

          return (
            <div
              key={index}
              className={`relative ring-1 p-2 text-center min-h-[81px] ${
                value === 0 ? "text-red-500 font-bold" : ""
              } ${isHighlighted ? "bg-purple-800" : ""}`}
            >
              {value === 0 ? "INSOLVENT" : value}
              <Divider />
              {companiesOnCell.length > 0 && (
                <AvatarGroup>
                  {companiesOnCell.map((company) => (
                    <Avatar key={company.id} name={company.name} />
                  ))}
                </AvatarGroup>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-center">Unfloated Companies</h2>
        <div className="flex justify-center gap-5">
          {unfloatedCompanies.map((company) => (
            <div
              className={`flex flex-col items-center cursor-pointer ${
                company.id === selectedCompanyId ? "ring-4 ring-blue-500" : ""
              }`}
              key={company.id}
              onClick={() =>
                handleUnfloatedCompanyClick(
                  company.id,
                  company.minFloat,
                  company.maxFloat
                )
              }
            >
              <span>{company.name}</span>
              <Avatar key={company.id} name={company.name} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default StockChart;
