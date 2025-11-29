"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search as SearchIcon, RotateCcw } from "lucide-react";

type SortOption = "asc" | "desc" | "none";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  sort: SortOption;
  setSort: (v: SortOption) => void;
}

export default function SearchSortControls({ search, setSearch, sort, setSort }: Props) {
  const isFilterActive = search !== "" || sort !== "none";

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch("");
    setSort("none");
  };

  return (
    <div className="w-full bg-card p-4 rounded-xl border shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books by title, author, or category..."
            aria-label="Search books"
            className="pl-10 h-10"
          />
        </div>

        <div className="flex w-full md:w-auto gap-4">
          <Select value={sort} onValueChange={(val) => setSort(val as SortOption)}>
            <SelectTrigger className="w-full md:w-[180px] h-10">
              <SelectValue placeholder="Sort By Title" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">Sort: Default</SelectItem>
                <SelectItem value="asc">Title: A → Z</SelectItem>
                <SelectItem value="desc">Title: Z → A</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isFilterActive}
            className="whitespace-nowrap h-10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
