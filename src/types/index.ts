// src/types/index.ts

export interface Block {
    id: string;
    label: string;
    onClick: () => void;
}

export interface Arrow {
    from: string;
    to: string;
    label?: string;
    onClick: () => void;
}