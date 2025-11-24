import { useState } from 'react';

export function useQueryParam(key: string, defaultValue: string = '') {
    const [value, setValue] = useState(() => {
        if (typeof window === 'undefined') return defaultValue;
        const params = new URLSearchParams(window.location.search);
        return params.get(key) || defaultValue;
    });

    return [value, setValue] as const;
}