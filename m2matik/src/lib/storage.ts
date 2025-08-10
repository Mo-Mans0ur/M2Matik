// simple local storage wrapper til projektets grunddata
export type PropertyType = "house" | "apartment" | "summerhouse";

export interface ProjectMeta {
    propertyType: PropertyType;
    sizeM2: number;
    basement: boolean;
    firstFloor: boolean;
    createdAt: string;
}

const KEY = "project_meta_v1";

export function saveProjectMeta(meta: ProjectMeta) {
    localStorage.setItem(KEY, JSON.stringify(meta));
}

export function loadProjectMeta(): ProjectMeta | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as ProjectMeta;
    } catch (error) {
        console.error("Failed to parse project meta:", error);
        return null;
    }
}

export function clearProjectMeta() {
    localStorage.removeItem(KEY);
}