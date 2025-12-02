"use client";

import React, { KeyboardEvent } from "react";
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
import { categories, VALID_BOOK_CATEGORIES } from "@/types";

type SortOption = "asc" | "desc" | "none";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  sort: SortOption;
  setSort: (v: SortOption) => void;
  onSearchSubmit: () => void;
  onSearchKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  onReset: () => void;
  category: categories | "all";
  onFilterCategory: (category: categories | "all") => void;
}

export default function SearchSortControls({
  search,
  setSearch,
  sort,
  setSort,
  onSearchKeyPress,
  onSearchSubmit,
  onReset,
  category,
  onFilterCategory,
}: Props) {
  const isFilterActive = search !== "" || sort !== "none" || category !== "all";

  return (
    <div className="w-full bg-card p-4 rounded-xl border shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyPress}
            placeholder="Search books by title"
            aria-label="Search books"
            className="pl-10 h-10"
          />
          <Button
            variant="outline"
            className="whitespace-nowrap absolute right-1 top-1/2 -translate-y-1/2 h-8 px-4 rounded-md "
            onClick={onSearchSubmit}
          >
            Search
          </Button>
        </div>

        <div className="flex w-full md:w-auto gap-4">
          {/* sort */}
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

          {/* category filter */}
          <Select
            value={category}
            onValueChange={(val) => onFilterCategory(val as categories | "all")}
          >
            <SelectTrigger className="w-full md:w-[180px] h-10">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Categories</SelectItem>
                {VALID_BOOK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={(e: React.FormEvent) => {
              e.preventDefault();
              onReset();
            }}
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
