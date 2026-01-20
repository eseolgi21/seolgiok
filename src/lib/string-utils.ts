
export function toFullWidth(str: string): string {
    return str.replace(/[!-~]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0))
        .replace(/ /g, "\u3000"); // Full-width Space
}

export function toHalfWidth(str: string): string {
    return str.replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
        .replace(/　/g, " "); // Half-width Space
}

export function getSearchVariants(str: string): string[] {
    const set = new Set<string>();
    set.add(str);
    set.add(toFullWidth(str));
    set.add(toHalfWidth(str));
    return Array.from(set).filter(s => s.trim().length > 0);
}
