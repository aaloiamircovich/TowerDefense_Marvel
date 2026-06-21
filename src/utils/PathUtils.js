export function normalizePath(path, width, height, margin = 40) {
    if (!Array.isArray(path) || path.length < 2) {
        return createFallbackPath(width, height, margin);
    }

    const insidePoints = path.map((point) => ({
        x: clamp(Number(point.x), 0, width),
        y: clamp(Number(point.y), 0, height)
    }));

    const safePath = [outsidePoint(insidePoints[0], width, height, true, margin), insidePoints[0]];

    for (let i = 1; i < insidePoints.length; i++) {
        const previous = safePath[safePath.length - 1];
        const next = insidePoints[i];

        if (previous.x !== next.x && previous.y !== next.y) {
            safePath.push({ x: next.x, y: previous.y });
        }

        safePath.push(next);
    }

    safePath.push(outsidePoint(insidePoints[insidePoints.length - 1], width, height, false, margin));
    return removeDuplicatePoints(safePath);
}

export function isOrthogonalPath(path) {
    if (!Array.isArray(path) || path.length < 2) return false;

    return path.every((point, index) => {
        if (index === 0) return Number.isFinite(point.x) && Number.isFinite(point.y);
        const previous = path[index - 1];
        return Number.isFinite(point.x)
            && Number.isFinite(point.y)
            && (previous.x === point.x || previous.y === point.y);
    });
}

export function removeDuplicatePoints(points) {
    return points.filter((point, index) => {
        const previous = points[index - 1];
        return !previous || previous.x !== point.x || previous.y !== point.y;
    });
}

function createFallbackPath(width, height, margin) {
    return [
        { x: -margin, y: 120 },
        { x: width * 0.35, y: 120 },
        { x: width * 0.35, y: height * 0.75 },
        { x: width * 0.72, y: height * 0.75 },
        { x: width * 0.72, y: height * 0.35 },
        { x: width + margin, y: height * 0.35 }
    ];
}

function outsidePoint(point, width, height, isStart, margin) {
    if (point.x <= 0) return { x: -margin, y: point.y };
    if (point.x >= width) return { x: width + margin, y: point.y };
    if (point.y <= 0) return { x: point.x, y: -margin };
    if (point.y >= height) return { x: point.x, y: height + margin };

    return isStart ? { x: -margin, y: point.y } : { x: width + margin, y: point.y };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
