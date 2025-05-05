import { FC, useState, useEffect } from 'react';
import styles from '../styles/SearchFilterBar.module.css';
import { useRouter } from 'next/router';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterConfig {
    id: string;
    label: string;
    options: FilterOption[];
}

export interface SearchFilterConfig {
    placeholder: string;
    filters: FilterConfig[];
}

interface SearchFilterBarProps {
    config: SearchFilterConfig;
    onSearch: (searchTerm: string, activeFilters: Record<string, string>) => void;
    initialSearchTerm?: string;
}

const SearchFilterBar: FC<SearchFilterBarProps> = ({ config, onSearch, initialSearchTerm = '' }) => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [showFilters, setShowFilters] = useState<boolean>(false);

    // Initialize search term and filters from URL
    useEffect(() => {
        if (router.isReady) {
            const { search, ...filterParams } = router.query;

            // Set search term from URL or initial value
            const newSearchTerm = typeof search === 'string' ? search : initialSearchTerm;
            setSearchTerm(newSearchTerm);

            // Set filters from URL
            const urlFilters: Record<string, string> = {};
            Object.entries(filterParams).forEach(([key, value]) => {
                if (typeof value === 'string' && config.filters.some(f => f.id === key)) {
                    urlFilters[key] = value;
                }
            });
            setActiveFilters(urlFilters);

            // Trigger initial search with parameters
            if (newSearchTerm || Object.keys(urlFilters).length > 0) {
                onSearch(newSearchTerm, urlFilters);
            }
        }
    }, [router.isReady, router.query, config.filters, initialSearchTerm, onSearch]);

    // Update search results when search term or filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearch(searchTerm, activeFilters);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, activeFilters, onSearch]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (filterId: string, value: string) => {
        setActiveFilters(prev => {
            // If empty value, remove the filter
            if (!value) {
                const { [filterId]: _, ...rest } = prev;
                return rest;
            }
            // Otherwise update or add the filter
            return { ...prev, [filterId]: value };
        });
    };

    const handleClearAll = () => {
        setSearchTerm('');
        setActiveFilters({});
    };

    const activeFilterCount = Object.keys(activeFilters).length;

    return (
        <div className={styles.searchFilterBar}>
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder={config.placeholder}
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <button
                    className={`${styles.filterButton} ${activeFilterCount > 0 ? styles.activeFilter : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    aria-label="Toggle filters"
                >
                    <span className={styles.filterIcon}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                        </svg>
                    </span>
                    {activeFilterCount > 0 && (
                        <span className={styles.filterCount}>{activeFilterCount}</span>
                    )}
                </button>

                {(activeFilterCount > 0 || searchTerm) && (
                    <button
                        className={styles.clearButton}
                        onClick={handleClearAll}
                        aria-label="Clear all filters and search"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {showFilters && (
                <div className={styles.filtersContainer}>
                    {config.filters.map(filter => (
                        <div key={filter.id} className={styles.filterGroup}>
                            <label htmlFor={filter.id} className={styles.filterLabel}>
                                {filter.label}
                            </label>
                            <select
                                id={filter.id}
                                className={styles.filterSelect}
                                value={activeFilters[filter.id] || ''}
                                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                            >
                                <option value="">All</option>
                                {filter.options.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchFilterBar; 