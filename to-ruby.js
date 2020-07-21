#!/bin/node
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import wanakana from "wanakana";
import kuromoji from "kuromoji";

async function toRubyPieces(word) {
    const kuroshiro = new Kuroshiro();
    await kuroshiro.init(new KuromojiAnalyzer());
    const segments = wanakana.tokenize(word, { detailed: true });
    let hiragana = await kuroshiro.convert(word, {
        mode: "okurigana",
        to: "hiragana",
    });
    var x = [];
    for (const { type, value } of segments) {
        if (type === "hiragana") {
            if (!hiragana.startsWith(value)) {
                throw "This shouldn't happen.";
            }
            x.push({ type, rb: value, rt: value });
            hiragana = hiragana.replace(value, "");
        } else if (type === "kanji") {
            // Use lazy match to only capture first of multiple pronunciations
            const r = new RegExp(`(${value})\\((.*?)\\)(.*)`);
            const [_, kanji, reading, rest] = hiragana.match(r);
            x.push({ type, rb: kanji, rt: reading });
            hiragana = rest;
        } else {
            // Handle punctuation
            x.push({ type, rb: value, rt: "" });
            hiragana = hiragana.replace(value, "");
        }
    }
    return x;
}

function serializeRubyPiece({ type, rb, rt }) {
    const romaji = wanakana.toRomaji(rt);
    const hiragana = type === "kanji" ? rt : "";
    return `<rb>${rb}</rb><rt data-romaji=${romaji} data-hiragana="${hiragana}">${romaji}</rt>`;
}

function serializeRuby(pieces) {
    return `<ruby>${pieces.map(serializeRubyPiece).join("")}</ruby>`;
}

async function main() {
    kuromoji
        .builder({ dicPath: "./node_modules/kuromoji/dict/" })
        .build(async function (err, tokenizer) {
            const segments = tokenizer
                .tokenize(process.argv[2])
                .map(t => t.surface_form);
            const res = await Promise.all(
                segments.map(async x => {
                    const pieces = await toRubyPieces(x);
                    return serializeRuby(pieces);
                })
            );
            console.log(res.join(""));
        });
}

main();
