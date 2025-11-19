'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';

interface ModernOperationsLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  headerActions?: React.ReactNode;
}

/**
 * Consistent layout wrapper for all modern operation phases
 * Provides uniform structure and styling
 */
export function ModernOperationsLayout({
  title,
  description,
  children,
  sidebar,
  headerActions,
}: ModernOperationsLayoutProps) {
  return (
    <div className="w-full h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          {description && (
            <p className="text-gray-400 max-w-2xl">{description}</p>
          )}
        </div>
        {headerActions && (
          <div className="flex gap-2">{headerActions}</div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className={`${sidebar ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {children}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <div className="lg:col-span-1 space-y-4">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Section card wrapper for consistent styling
 */
export function ModernOperationsSection({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`bg-gray-800/50 border border-gray-700 ${className}`}>
      {title && (
        <CardHeader className="pb-3">
          <h2 className="text-xl font-semibold text-gray-200">{title}</h2>
        </CardHeader>
      )}
      <CardBody>{children}</CardBody>
    </Card>
  );
}

