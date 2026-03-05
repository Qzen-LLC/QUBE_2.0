"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Archetype {
  id: string;
  name: string;
  description: string;
  category: string;
  default_pillar_values?: Record<string, Record<string, unknown>>;
}

interface ArchetypeSelectorProps {
  onSelect: (archetype: Archetype) => void;
  onSkip: () => void;
}

export function ArchetypeSelector({ onSelect, onSkip }: ArchetypeSelectorProps) {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);

  useEffect(() => {
    fetch("/api/architect/archetypes")
      .then((r) => r.json())
      .then(setArchetypes)
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white">
          Select an Archetype or Start from Scratch
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Choose a pre-built template to auto-fill the wizard, or define your
          use case manually.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {archetypes.map((a) => (
          <Card
            key={a.id}
            className="p-5 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition group dark:bg-gray-900 dark:border-gray-800"
            onClick={() => onSelect(a)}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              {a.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {a.description}
            </p>
            <span className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              {a.category}
            </span>
          </Card>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition underline"
        >
          Skip templates, start from scratch
        </button>
      </div>
    </div>
  );
}
