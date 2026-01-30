"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";

const Search = ({ placeholder = "Search..." }: { placeholder?: string }) => {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      let newUrl = "";

      if (query) {
        newUrl = formUrlQuery({
          searchParams: searchParams.toString(),
          key: "query",
          value: query,
        });
      } else {
        newUrl = removeKeysFromQuery({
          searchParams: searchParams.toString(),
          keysToRemove: ["query"],
        });
      }

      router.push(newUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchParams, router]);

  return (
    <div className="flex-center min-h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
      <SearchIcon width={24} height={24} />
      <Input
        type="text"
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        className="p-16-medium h-[50px] border-0 bg-transparent placeholder:text-dark-400 focus:ring-0 focus:ring-offset-0 !important shadow-none outline-none"
      />
    </div>
  );
};

export default Search;
