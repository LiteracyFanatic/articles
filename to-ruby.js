#!/bin/node
import Kuroshiro from "kuroshiro";
import wanakana from "wanakana";
import kuromoji from "kuromoji";

function isJapanesePunctuation(char) {
    return !!char.match(new RegExp("[\u3000-\u303f]", "u"));
}

// Assumptions
// 1. There are never more than 4 tokens. This holds true for ~99% of the 22,000
//    most frequently used Japanese words in the EDICT dictionary.
// 2. Kanji and non-kanji tokens alternate.
// 3. All characters in pronunciation are hiragana or punctuation. This should
// be true because we convert them before passing them in.
function assignPronunciations(tokens, pronunciation) {
    if (tokens.length > 4) {
        throw new Error("More than 4 tokens.");
    }

    if (
        !Array.of(pronunciation).every(
            c => Kuroshiro.Util.isHiragana(c) || isJapanesePunctuation(c)
        )
    ) {
        throw new Error("Pronunciation contains non-hiragana characters.");
    }

    const x = [];
    switch (tokens.length) {
        case 1: {
            x.push({
                type: tokens[0].type,
                rb: tokens[0].value,
                rt: pronunciation
            });
            break;
        }
        case 2: {
            const [a, b] = tokens;
            if (a.type === "hiragana") {
                x.push({ type: a.type, rb: a.value, rt: a.value });
                x.push({
                    type: b.type,
                    rb: b.value,
                    rt: pronunciation.replace(a.value, "")
                });
            } else {
                x.push({
                    type: a.type,
                    rb: a.value,
                    rt: pronunciation.replace(new RegExp(`${b.value}$`, "u"), "")
                });
                x.push({ type: b.type, rb: b.value, rt: b.value });
            }
            break;
        }
        case 3: {
            const [a, b, c] = tokens;
            if (a.type === "hiragana") {
                const r = new RegExp(`${a.value}(.*)${c.value}`, "u");
                const m = pronunciation.match(r);
                x.push({ type: a.type, rb: a.value, rt: a.value });
                x.push({ type: b.type, rb: b.value, rt: m[1] });
                x.push({ type: c.type, rb: c.value, rt: c.value });
            } else {
                const r = new RegExp(`(.*)${b.value}(.*)`, "u");
                const m = pronunciation.match(r);
                x.push({ type: a.type, rb: a.value, rt: m[1] });
                x.push({ type: b.type, rb: b.value, rt: b.value });
                x.push({ type: c.type, rb: c.value, rt: m[2] });
            }
            break;
        }
        case 4: {
            const [a, b, c, d] = tokens;
            if (a.type === "hiragana") {
                const r = new RegExp(`${a.value}(.*)${c.value}(.*)`, "u");
                const m = pronunciation.match(r);
                x.push({ type: a.type, rb: a.value, rt: a.value });
                x.push({ type: b.type, rb: b.value, rt: m[1] });
                x.push({ type: c.type, rb: c.value, rt: c.value });
                x.push({ type: d.type, rb: d.value, rt: m[2] });
            } else {
                const r = new RegExp(`(.*)${b.value}(.*)${d.value}`, "u");
                const m = pronunciation.match(r);
                x.push({ type: a.type, rb: a.value, rt: m[1] });
                x.push({ type: b.type, rb: b.value, rt: b.value });
                x.push({ type: c.type, rb: c.value, rt: m[2] });
                x.push({ type: d.type, rb: d.value, rt: d.value });
            }
            break;
        }
    }
    return x;
}

// Test cases for all of the possible permutations with 3 tokens
// console.error(assignPronunciations([{ type: "kanji", value: "私" }], "わたし"));
// console.error(assignPronunciations([{ type: "hiragana", value: "これ" }], "これ"));
// console.error(assignPronunciations([{ type: "kanji", value: "前置" }, { type: "hiragana", value: "き" }], "まえおき"));
// console.error(assignPronunciations([{ type: "hiragana", value: "うつ" }, { type: "kanji", value: "病" }], "うつびょう"));
// console.error(assignPronunciations([{ type: "hiragana", value: "お" }, { type: "kanji", value: "母" }, { type: "hiragana", value: "さん" }], "おかあさん"));
// console.error(assignPronunciations([{ type: "kanji", value: "鳴" }, { type: "hiragana", value: "き" }, { type: "kanji", value: "声" }], "なきごえ"));

async function toRubyPieces(word) {
    const tokens = wanakana.tokenize(word.value, { detailed: true });
    return assignPronunciations(tokens, word.pronunciation);
}

function serializeRubyPiece({ type, rb, rt }) {
    const romaji = wanakana.toRomaji(rt);
    const hiragana = type === "kanji" ? rt : "";
    return `<rb>${rb}</rb><rt data-romaji="${romaji}" data-hiragana="${hiragana}">${romaji}</rt>`;
}

function serializeRuby(pieces) {
    return `<ruby>${pieces.map(serializeRubyPiece).join("")}</ruby>`;
}

function *mergeTokens(tokens) {
    let i = 0;
    while (i < tokens.length) {
        if (tokens[i].pos === "動詞") {
            let value = tokens[i].surface_form;
            let pronunciation = tokens[i].pronunciation;
            i++;
            while (i < tokens.length && tokens[i].pos === "助動詞") {
                value += tokens[i].surface_form;
                pronunciation += tokens[i].pronunciation;
                i++;
            }
            yield {
                value,
                pronunciation: Kuroshiro.Util.kanaToHiragna(pronunciation)
            };
        } else {
            yield {
                value: tokens[i].surface_form,
                pronunciation: Kuroshiro.Util.kanaToHiragna(tokens[i].reading)
            };
            i++;
        }
    }
}

kuromoji
    .builder({ dicPath: "./node_modules/kuromoji/dict/" })
    .build(async (err, tokenizer) => {
        const segments = tokenizer.tokenize(process.argv[2]);
        const words = [...mergeTokens(segments)];
        const res = await Promise.all(
            words.map(async x => {
                const pieces = await toRubyPieces(x);
                return serializeRuby(pieces);
            })
        );
        console.log(res.join(""));
    });
