import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
    return (
        <div className="relative group w-full md:max-w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline-variant">
                <Search size={16} color='#4D4D4D' />
            </div>
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search Doctor"
                aria-label="Search doctor"
                // Same height, border and text as the filter dropdowns beside it.
                className="h-12 w-full rounded-md border border-[#E2E5E9] bg-white pl-11 pr-4 text-base sm:text-sm font-medium outline-none transition-colors placeholder:text-[#8A8A8A] hover:border-[#C9CED6] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
            />
        </div>
    );
};

export default SearchBar;