interface LineType {
    type: 'context' | 'added' | 'removed';
    oldFileLineNumber?: number | null;
    newFileLineNumber?: number | null;
    content: string;
}

interface HunkType {
    oldFileStartLine: number;
    oldFilePatchLinesCount: number;
    newFileStartLine: number;
    newFilePatchLinesCount: number;
    lines: LineType[];
}

export type LineContainingHunk = (LineType & {
    hunk?: {
        oldFileStartLine: number;
        oldFilePatchLinesCount: number;
        newFileStartLine: number;
        newFilePatchLinesCount: number;
    };
})

export type VirtualTableRow = {
    aLine: LineContainingHunk | null;
    bLine: LineContainingHunk | null;
}

function flattenHunks(hunks: HunkType[], version: 'old' | 'new'): LineContainingHunk[] {
    const filteredHunksByVersion: HunkType[] = [];

    hunks.forEach(hunk => {
        const filteredLinesByVersion = hunk.lines.filter((line) => {
            if (version === 'old') {
                return line.type === 'context' || line.type === 'removed'
            }
            return line.type === 'context' || line.type === 'added'
        });

        if (filteredLinesByVersion.length) {
            filteredHunksByVersion.push({
                ...hunk,
                lines: filteredLinesByVersion,
            })
        }
    });

    const lines: LineContainingHunk[] = [];

    filteredHunksByVersion.forEach((hunk, hunkIndex) => {
        const [firstList, ...remainingLines] = hunk.lines;
        lines.push(...[{
            ...firstList,
            hunk: {
                oldFileStartLine: hunk.oldFileStartLine,
                oldFilePatchLinesCount: hunk.oldFilePatchLinesCount,
                newFileStartLine: hunk.newFileStartLine,
                newFilePatchLinesCount: hunk.newFilePatchLinesCount,
            }
        }, ...remainingLines]);
    })
    return lines;
}

export function buildVirtualTable(aHunks: HunkType[], bHunks: HunkType[], aVersion: 'old' | 'new', bVersion: 'old' | 'new'): VirtualTableRow[] {
    const getLineNumber = (line: LineContainingHunk, version: 'old' | 'new') => {
        if (version === 'old') {
            return line.oldFileLineNumber;
        }
        return line.newFileLineNumber;
    }

    const aLines = flattenHunks(aHunks, aVersion);
    const bLines = flattenHunks(bHunks, bVersion);

    const aLinesByLineNumber = new Map<number, LineContainingHunk>();
    const bLinesByLineNumber = new Map<number, LineContainingHunk>();

    aLines.forEach(line => {
        const lineNumber = getLineNumber(line, aVersion);
        if (!lineNumber) return;
        aLinesByLineNumber.set(lineNumber, line);
    });
    bLines.forEach(line => {
        const lineNumber = getLineNumber(line, bVersion);
        if (!lineNumber) return;
        bLinesByLineNumber.set(lineNumber, line);
    })

    const lineNumberRange = Array.from(new Set([
        ...aLinesByLineNumber.keys(),
        ...bLinesByLineNumber.keys(),
    ])).sort((a, b) => a - b);

    const rows: VirtualTableRow[] = [];
    lineNumberRange.forEach(lineNumber => {
        const aLine = aLinesByLineNumber.get(lineNumber) ?? null;
        const bLine = bLinesByLineNumber.get(lineNumber) ?? null;

        rows.push({ aLine, bLine });
    });
    return rows;
}
