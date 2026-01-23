"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function normalizeOptionMarkers(text) {
    // (a) -> a)
    text = text.replace(/\(\s*([a-dA-D])\s*\)/g, "$1)");
    // a. -> a)
    text = text.replace(/\b([a-dA-D])\s*\./g, "$1)");
    // "a )" -> "a)"
    text = text.replace(/\b([a-dA-D])\s*\)/g, "$1)");
    return text;
}
function parseOneBlock(block, id) {
    const lines = block
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length === 0)
        return null;
    const correctLineIdx = lines.findIndex((l) => l.toLowerCase().includes("correct answer:"));
    if (correctLineIdx === -1)
        return null;
    const correctLine = lines[correctLineIdx];
    const mCorrect = correctLine.match(/Correct Answer:\s*([a-dA-D])/);
    if (!mCorrect)
        return null;
    const correct = mCorrect[1].toLowerCase();
    const main = normalizeOptionMarkers(lines.slice(0, correctLineIdx).join(" "));
    const mA = main.match(/\ba\)/);
    if (!mA || mA.index == null)
        return null;
    const question = main.slice(0, mA.index).trim().replace(/[ :;-]+$/g, "");
    const optionsText = main.slice(mA.index).trim();
    // Capture option blocks: a) ... b) ... c) ... d) ...
    const optPattern = /\b([a-dA-D])\)\s*([\s\S]*?)(?=\b[a-dA-D]\)|$)/g;
    const options = {};
    let match;
    while ((match = optPattern.exec(optionsText)) !== null) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        options[key] = value;
    }
    const fullOptions = {
        a: options.a ?? "",
        b: options.b ?? "",
        c: options.c ?? "",
        d: options.d ?? "",
    };
    if (!question)
        return null;
    // Must have at least 2 non-empty options; some lines might be malformed.
    const nonEmptyCount = Object.values(fullOptions).filter((v) => v.trim()).length;
    if (nonEmptyCount < 2)
        return null;
    return {
        id,
        question,
        options: fullOptions,
        correct,
        source: "PROVIQUIZ.txt",
    };
}
function buildBlocks(raw) {
    // Line-based grouping: accumulate lines until we hit "Correct Answer:".
    // This avoids leaking the previous answer letter into the next question block.
    const lines = raw.split(/\r?\n/);
    const blocks = [];
    let current = [];
    for (const line of lines) {
        const trimmed = line.trimEnd();
        if (!trimmed) {
            // keep blank lines minimal; they help separate question text from options sometimes
            if (current.length > 0 && current[current.length - 1] !== "")
                current.push("");
            continue;
        }
        current.push(trimmed);
        if (trimmed.toLowerCase().includes("correct answer:")) {
            blocks.push(current.join("\n").trim());
            current = [];
        }
    }
    return blocks.filter(Boolean);
}
async function main() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("Missing MONGO_URI. Create server/.env with MONGO_URI=...");
        process.exit(1);
    }
    const defaultInput = node_path_1.default.resolve(process.cwd(), "..", "PROVIQUIZ.txt");
    const inputPath = process.env.PROVIQUIZ_INPUT
        ? node_path_1.default.resolve(process.env.PROVIQUIZ_INPUT)
        : defaultInput;
    if (!node_fs_1.default.existsSync(inputPath)) {
        console.error(`Input file not found: ${inputPath}`);
        console.error(`Tip: set PROVIQUIZ_INPUT to the file path, or place PROVIQUIZ.txt at: ${defaultInput}`);
        process.exit(1);
    }
    const raw = node_fs_1.default.readFileSync(inputPath, "utf-8");
    const blocks = buildBlocks(raw);
    const parsed = [];
    let nextId = 1;
    for (const b of blocks) {
        const q = parseOneBlock(b, nextId);
        if (q) {
            parsed.push(q);
            nextId += 1;
        }
    }
    console.log(`Parsed ${parsed.length} questions from ${node_path_1.default.basename(inputPath)}`);
    if (parsed.length === 0)
        process.exit(1);
    await mongoose_1.default.connect(mongoUri, { dbName: "proviQuiz" });
    const collectionName = process.env.MONGO_COLLECTION || "questions";
    const collection = mongoose_1.default.connection.collection(collectionName);
    // Replace all questions on each import to keep it simple + deterministic.
    const del = await collection.deleteMany({ source: "PROVIQUIZ.txt" });
    console.log(`Deleted ${del.deletedCount} existing questions (source=PROVIQUIZ.txt)`);
    const ins = await collection.insertMany(parsed);
    console.log(`Inserted ${ins.insertedCount} questions into collection '${collectionName}'`);
    await mongoose_1.default.disconnect();
}
main().catch(async (err) => {
    console.error(err);
    try {
        await mongoose_1.default.disconnect();
    }
    catch { }
    process.exit(1);
});
//# sourceMappingURL=importProviquiz.js.map